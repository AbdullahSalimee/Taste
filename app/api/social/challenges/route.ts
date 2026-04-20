import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function getUserId(request: NextRequest): Promise<string | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const {
    data: { user },
  } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ).auth.getUser(auth.slice(7));
  return user?.id ?? null;
}

// ── Challenge definitions (hardcoded for now, easily movable to DB) ───────────
// Each challenge is weekly. The "filter" describes what counts toward progress.

interface ChallengeDef {
  id: string;
  title: string;
  description: string;
  goal: number; // how many films/episodes needed
  unit: string; // "films" | "episodes" | "titles"
  icon: string; // emoji
  color: string;
  filter: {
    decade?: string; // "1970s", "1980s", etc — matches release year
    genre?: string; // genre name substring match
    language?: string; // ISO 639-1 code
    media_type?: "movie" | "tv";
    min_runtime?: number; // minutes
  };
  expires_at: string; // ISO date — Sunday midnight of current week
}

function getSundayMidnight(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const sunday = new Date(now);
  sunday.setUTCDate(now.getUTCDate() + daysUntilSunday);
  sunday.setUTCHours(23, 59, 59, 999);
  return sunday.toISOString();
}

function getMondayMidnight(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString();
}

// Rotate challenges weekly based on week number
function getCurrentChallenges(): ChallengeDef[] {
  const now = new Date();
  const weekNum = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
  const expires = getSundayMidnight();

  const allChallenges: ChallengeDef[] = [
    {
      id: "70s_film",
      title: "Back to the 70s",
      description: "Watch a film released between 1970 and 1979.",
      goal: 1,
      unit: "film",
      icon: "🎞",
      color: "#C87C2A",
      filter: { decade: "1970s", media_type: "movie" },
      expires_at: expires,
    },
    {
      id: "foreign_language",
      title: "Lost in Translation",
      description: "Watch 2 non-English language films this week.",
      goal: 2,
      unit: "films",
      icon: "🌍",
      color: "#2A5C8A",
      filter: { language: "non-en", media_type: "movie" },
      expires_at: expires,
    },
    {
      id: "documentary",
      title: "Truth Seeker",
      description: "Log a documentary — any length, any topic.",
      goal: 1,
      unit: "documentary",
      icon: "🔍",
      color: "#4A9E6B",
      filter: { genre: "Documentary" },
      expires_at: expires,
    },
    {
      id: "short_films",
      title: "The Shorts",
      description: "Watch 3 films under 90 minutes.",
      goal: 3,
      unit: "films",
      icon: "⚡",
      color: "#8A2A5C",
      filter: { media_type: "movie", max_runtime: 90 } as any,
      expires_at: expires,
    },
    {
      id: "horror",
      title: "Fear Itself",
      description: "Log a horror film this week.",
      goal: 1,
      unit: "film",
      icon: "👁",
      color: "#8A2A2A",
      filter: { genre: "Horror", media_type: "movie" },
      expires_at: expires,
    },
    {
      id: "animation",
      title: "Drawn to Cinema",
      description: "Watch 2 animated films or series.",
      goal: 2,
      unit: "titles",
      icon: "✏",
      color: "#2A6A8A",
      filter: { genre: "Animation" },
      expires_at: expires,
    },
    {
      id: "classic_80s",
      title: "Totally 80s",
      description: "Log a film from the 1980s.",
      goal: 1,
      unit: "film",
      icon: "📼",
      color: "#5C4A8A",
      filter: { decade: "1980s", media_type: "movie" },
      expires_at: expires,
    },
    {
      id: "east_asian",
      title: "Eastern Lens",
      description: "Watch a Korean, Japanese or Chinese film.",
      goal: 1,
      unit: "film",
      icon: "🏮",
      color: "#C87C2A",
      filter: { language: "east_asian" },
      expires_at: expires,
    },
  ];

  // Pick 3 challenges for this week, rotating by week number
  const picks: ChallengeDef[] = [];
  for (let i = 0; i < 3; i++) {
    picks.push(allChallenges[(weekNum + i) % allChallenges.length]);
  }
  return picks;
}

// ── Check user progress against a challenge ───────────────────────────────────

async function checkProgress(
  db: ReturnType<typeof getDb>,
  userId: string,
  challenge: ChallengeDef,
  since: string,
): Promise<number> {
  let query = db
    .from("logs")
    .select(
      "id, titles(release_date, original_language, runtime, genres:title_genres(genres(name)))",
    )
    .eq("user_id", userId)
    .gte("watched_at", since)
    .in("status", ["watched"]);

  if (challenge.filter.media_type) {
    query = query.eq(
      "titles.media_type",
      challenge.filter.media_type === "movie" ? "movie" : "tv",
    );
  }

  const { data: logs } = await query;
  if (!logs?.length) return 0;

  let count = 0;
  for (const log of logs) {
    const title = (log as any).titles;
    if (!title) continue;

    const year = title.release_date
      ? new Date(title.release_date).getFullYear()
      : 0;
    const lang = title.original_language || "";
    const runtime = title.runtime || 0;
    const genreNames: string[] = (title.genres || [])
      .map((g: any) => g?.genres?.name)
      .filter(Boolean);

    const f = challenge.filter;

    // Decade filter
    if (f.decade) {
      const decadeStart = parseInt(f.decade);
      if (year < decadeStart || year >= decadeStart + 10) continue;
    }

    // Genre filter
    if (
      f.genre &&
      !genreNames.some((g) => g.toLowerCase().includes(f.genre!.toLowerCase()))
    )
      continue;

    // Language filter
    if (f.language === "non-en" && lang === "en") continue;
    if (f.language === "east_asian" && !["ko", "ja", "zh"].includes(lang))
      continue;

    // Runtime filter
    if (
      (f as any).max_runtime &&
      runtime > 0 &&
      runtime > (f as any).max_runtime
    )
      continue;

    count++;
  }

  return Math.min(count, challenge.goal);
}

// GET /api/social/challenges
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  const db = getDb();
  const challenges = getCurrentChallenges();
  const since = getMondayMidnight();

  // Get community participant counts (how many users logged toward each challenge this week)
  // We approximate this by counting distinct users who logged anything this week
  const { data: weeklyUsers } = await db
    .from("logs")
    .select("user_id")
    .gte("watched_at", since)
    .eq("status", "watched");

  const participantCount = new Set((weeklyUsers || []).map((l) => l.user_id))
    .size;

  // Get user progress if authenticated
  const progressMap: Record<string, number> = {};
  if (userId) {
    for (const challenge of challenges) {
      progressMap[challenge.id] = await checkProgress(
        db,
        userId,
        challenge,
        since,
      );
    }
  }

  return NextResponse.json({
    week_start: since,
    expires_at: getSundayMidnight(),
    challenges: challenges.map((c) => ({
      ...c,
      progress: progressMap[c.id] ?? 0,
      completed: (progressMap[c.id] ?? 0) >= c.goal,
      participants: Math.max(participantCount, 1), // at least 1 shown
    })),
  });
}
