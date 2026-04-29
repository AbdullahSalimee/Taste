import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const client = new Anthropic();

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { query, user_watchlist_ids = [] } = body;

  if (!query?.trim()) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const db = getDb();

  // Ask Claude to extract structured filters from the natural language query
  const systemPrompt = `You are a film recommendation assistant. Extract structured search filters from a natural language movie/TV query.

Return ONLY valid JSON with these optional fields:
{
  "genres": ["Drama", "Thriller"],  // from: Action, Adventure, Animation, Comedy, Crime, Documentary, Drama, Fantasy, Horror, Mystery, Romance, Sci-Fi, Thriller, War, Western, Family, History
  "languages": ["fr", "ko", "ja", "zh", "es", "de", "hi", "it"],  // ISO codes for non-English. Omit for English or any language
  "max_runtime": 100,  // in minutes, only if user mentions short/brief/under X minutes
  "min_runtime": 120,  // in minutes, only if user mentions long/epic
  "decades": ["1990s", "2000s"],  // if user mentions era/decade/time period
  "media_type": "movie",  // "movie" or "tv" or omit for both
  "min_rating": 3.5,  // out of 5, if user wants good/acclaimed/masterpiece
  "keywords": ["psychological", "slow burn", "nonlinear"],  // tone/style/theme words
  "exclude_american": true,  // if user explicitly says "not American" or "foreign"
  "explanation": "Brief explanation of what you understood"
}

Do not include fields that aren't relevant. Return pure JSON only, no markdown.`;

  let filters: any = {};
  let aiExplanation = "";

  try {
    const aiRes = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: query }],
    });

    const text = aiRes.content.find(b => b.type === "text")?.text || "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    filters = parsed;
    aiExplanation = parsed.explanation || "";
    delete filters.explanation;
  } catch (e) {
    // Fallback to basic text search
    filters = { keywords: [query] };
  }

  // Now query our Supabase titles table with the extracted filters
  const COLS = "id,tmdb_id,media_type,title,year,overview,poster_path,backdrop_path,tmdb_rating,tmdb_rating_5,community_rating,vote_count,popularity,original_language,runtime,status";

  let q = db.from("titles").select(COLS);

  // Media type
  if (filters.media_type === "movie") q = q.eq("media_type", "movie");
  else if (filters.media_type === "tv") q = q.eq("media_type", "tv");

  // Exclude American (English language) films
  if (filters.exclude_american) q = q.neq("original_language", "en");

  // Language filter
  if (filters.languages?.length === 1) {
    q = q.eq("original_language", filters.languages[0]);
  }

  // Runtime constraints
  if (filters.max_runtime) q = q.lte("runtime", filters.max_runtime).gt("runtime", 0);
  if (filters.min_runtime) q = q.gte("runtime", filters.min_runtime);

  // Rating
  if (filters.min_rating) q = q.gte("tmdb_rating_5", filters.min_rating);

  // Min vote count for quality
  q = q.gte("vote_count", 100);

  // Decade filter
  if (filters.decades?.length > 0) {
    const decade = parseInt(filters.decades[0]);
    if (!isNaN(decade)) {
      q = q.gte("year", decade).lte("year", decade + 9);
    }
  }

  // Sort by community rating if available, else tmdb_rating_5
  q = q.order("popularity", { ascending: false, nullsFirst: false });
  q = q.limit(200);

  const { data: candidates } = await q;
  if (!candidates?.length) {
    return NextResponse.json({
      results: [],
      explanation: aiExplanation || "No results found. Try a different query.",
      filters,
    });
  }

  // Genre filter via title_genres join (post-fetch)
  let genreFiltered = candidates;
  if (filters.genres?.length > 0) {
    // Get genre IDs
    const { data: genreRows } = await db
      .from("genres")
      .select("id, name")
      .in("name", filters.genres);

    if (genreRows?.length) {
      const genreIds = genreRows.map(g => g.id);
      const titleIds = candidates.map(c => c.id);

      const { data: titleGenres } = await db
        .from("title_genres")
        .select("title_id")
        .in("genre_id", genreIds)
        .in("title_id", titleIds);

      const matchingTitleIds = new Set(titleGenres?.map(tg => tg.title_id));
      genreFiltered = candidates.filter(c => matchingTitleIds.has(c.id));
    }
  }

  // Keyword matching (against title + overview)
  let keyFiltered = genreFiltered;
  if (filters.keywords?.length > 0) {
    const kws = filters.keywords.map((k: string) => k.toLowerCase());
    // Boost titles that match keywords, don't hard-filter
    keyFiltered = genreFiltered.sort((a, b) => {
      const aText = `${a.title} ${a.overview || ""}`.toLowerCase();
      const bText = `${b.title} ${b.overview || ""}`.toLowerCase();
      const aMatches = kws.filter((k: string) => aText.includes(k)).length;
      const bMatches = kws.filter((k: string) => bText.includes(k)).length;
      if (bMatches !== aMatches) return bMatches - aMatches;
      return b.popularity - a.popularity;
    });
  }

  // Remove items already in user's watchlist if provided
  const watchlistSet = new Set(user_watchlist_ids);
  const filtered = keyFiltered.filter(c => !watchlistSet.has(c.tmdb_id));

  const TMDB_IMG = "https://image.tmdb.org/t/p";
  const results = filtered.slice(0, 24).map(r => ({
    id: r.tmdb_id,
    tmdb_id: r.tmdb_id,
    db_id: r.id,
    type: r.media_type === "movie" ? "film" : "series",
    media_type: r.media_type,
    title: r.title,
    year: r.year,
    overview: r.overview,
    poster_url: r.poster_path ? `${TMDB_IMG}/w342${r.poster_path}` : null,
    tmdb_rating: r.tmdb_rating,
    tmdb_rating_5: r.tmdb_rating_5,
    community_rating: r.community_rating,
    vote_count: r.vote_count,
    original_language: r.original_language,
    runtime: r.runtime,
  }));

  return NextResponse.json({
    results,
    explanation: aiExplanation,
    filters,
    total: results.length,
  });
}