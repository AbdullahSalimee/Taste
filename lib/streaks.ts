/**
 * lib/streaks.ts
 * Calculates watch streaks from local log data.
 * A "day" counts if at least one title was logged that calendar day.
 */

import { getLogs } from "./store";

export interface StreakData {
  current: number; // current consecutive days streak
  longest: number; // all-time longest streak
  thisWeek: number; // titles logged in the current Mon–Sun week
  weekGoal: number; // configurable weekly goal (default 5)
  todayLogged: boolean; // has the user logged anything today?
  lastSevenDays: boolean[]; // true = logged that day, [0]=today, [6]=6 days ago
  flameLevel: "cold" | "warm" | "hot" | "blazing"; // visual tier
}

const LS_GOAL = "taste_streak_weekly_goal";
const LS_LONGEST = "taste_streak_longest";

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD in local time workaround
}

function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getStreakData(): StreakData {
  const logs = getLogs();
  const weekGoal = getWeeklyGoal();

  // Collect unique days that have at least one log
  const loggedDays = new Set<string>();
  for (const log of logs) {
    if (!log.watched_at) continue;
    loggedDays.add(localDateStr(new Date(log.watched_at)));
  }

  const today = new Date();
  const todayStr = localDateStr(today);

  // ── Current streak ──────────────────────────────────────────────────────
  let current = 0;
  const cursor = new Date(today);
  // If today has no log yet, start counting from yesterday
  // (don't break streak just because it's early in the day)
  if (!loggedDays.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (loggedDays.has(localDateStr(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // ── Longest streak ──────────────────────────────────────────────────────
  const sortedDays = Array.from(loggedDays).sort();
  let runningLongest = 0;
  let runLen = 0;
  let prevDate: Date | null = null;

  for (const dayStr of sortedDays) {
    const d = new Date(dayStr + "T12:00:00");
    if (!prevDate) {
      runLen = 1;
    } else {
      const diff = (d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      runLen = diff <= 1.1 ? runLen + 1 : 1; // 1.1 to absorb DST edge
    }
    if (runLen > runningLongest) runningLongest = runLen;
    prevDate = d;
  }

  // Persist longest streak
  const storedLongest = getStoredLongest();
  const longest = Math.max(runningLongest, storedLongest, current);
  if (longest > storedLongest) setStoredLongest(longest);

  // ── This week (Mon–Sun) ─────────────────────────────────────────────────
  const monday = new Date(today);
  const day = today.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  let thisWeek = 0;
  for (const log of logs) {
    if (!log.watched_at) continue;
    const logDate = new Date(log.watched_at);
    if (logDate >= monday) thisWeek++;
  }

  // ── Last 7 days booleans ────────────────────────────────────────────────
  const lastSevenDays: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    lastSevenDays.push(loggedDays.has(localDateStr(d)));
  }

  // ── Flame level ─────────────────────────────────────────────────────────
  let flameLevel: StreakData["flameLevel"] = "cold";
  if (current >= 30) flameLevel = "blazing";
  else if (current >= 14) flameLevel = "hot";
  else if (current >= 3) flameLevel = "warm";

  return {
    current,
    longest,
    thisWeek,
    weekGoal,
    todayLogged: loggedDays.has(todayStr),
    lastSevenDays,
    flameLevel,
  };
}

export function getWeeklyGoal(): number {
  if (typeof window === "undefined") return 5;
  return parseInt(localStorage.getItem(LS_GOAL) || "5", 10);
}

export function setWeeklyGoal(goal: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_GOAL, String(goal));
}

function getStoredLongest(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(LS_LONGEST) || "0", 10);
}

function setStoredLongest(n: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_LONGEST, String(n));
}
