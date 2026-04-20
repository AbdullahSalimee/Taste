import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TMDB_IMG = "https://image.tmdb.org/t/p";

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// GET /api/activity — recent community activity
export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const limit = 30;
  const offset = (page - 1) * limit;

  const db = getDb();

  // Get recent reviews with title info
  const { data: reviews } = await db
    .from("reviews")
    .select(
      `
      id, body, rating, likes, created_at,
      profiles ( id, username, display_name ),
      titles ( tmdb_id, media_type, title, poster_path, year )
    `,
    )
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Get recent ratings
  const { data: ratings } = await db
    .from("user_ratings")
    .select(
      `
      id, rating, rated_at,
      profiles ( id, username, display_name ),
      titles ( tmdb_id, media_type, title, poster_path, year )
    `,
    )
    .order("rated_at", { ascending: false })
    .range(offset, offset + Math.floor(limit / 2) - 1);

  // Merge and sort by date
  const activity: any[] = [];

  for (const r of reviews || []) {
    const title = r.titles as any;
    const profile = r.profiles as any;
    activity.push({
      id: `review_${r.id}`,
      type: "review",
      author: profile?.display_name || profile?.username || "someone",
      author_username: profile?.username || null,
      action: "reviewed",
      body: r.body,
      rating: r.rating,
      likes: r.likes,
      date: r.created_at,
      title: title?.title,
      tmdb_id: title?.tmdb_id,
      media_type: title?.media_type,
      year: title?.year,
      poster_url: title?.poster_path
        ? `${TMDB_IMG}/w185${title.poster_path}`
        : null,
    });
  }

  for (const r of ratings || []) {
    const title = r.titles as any;
    const profile = r.profiles as any;
    activity.push({
      id: `rating_${r.id}`,
      type: "rating",
      author: profile?.display_name || profile?.username || "someone",
      author_username: profile?.username || null,
      action: "rated",
      rating: r.rating,
      date: r.rated_at,
      title: title?.title,
      tmdb_id: title?.tmdb_id,
      media_type: title?.media_type,
      year: title?.year,
      poster_url: title?.poster_path
        ? `${TMDB_IMG}/w185${title.poster_path}`
        : null,
    });
  }

  // Sort merged by date desc
  activity.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return NextResponse.json({
    activity: activity.slice(0, limit),
    page,
    has_more: activity.length >= limit,
  });
}
