import React, { Suspense } from 'react';
import { createClient } from '../../lib/supabaseServer';
import { redirect } from 'next/navigation';
import RecapLoading from './loading';
import EmptyRecapFallback from '../../components/recap/EmptyRecapFallback';
import RecapClientWrapper from '../../components/recap/RecapClientWrapper';
import {
  getPreviousSeasonId,
  getSeasonUtcBoundaries,
  getSeasonDisplayName,
  calculateSeasonReset,
} from '../../lib/rankedSystem';

export const dynamic = 'force-dynamic';

export default async function RecapPage(props: {
  searchParams?: Promise<{ season?: string; devDate?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // 1. Resolve PREVIOUS completed season and strict UTC boundaries
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  let previousSeasonKey: string;
  if (process.env.NODE_ENV !== 'production' && searchParams?.season) {
    previousSeasonKey = searchParams.season;
  } else if (process.env.NODE_ENV !== 'production' && searchParams?.devDate) {
    previousSeasonKey = getPreviousSeasonId(new Date(searchParams.devDate));
  } else {
    const now = new Date();
    previousSeasonKey = getPreviousSeasonId(now);
  }

  const seasonDisplayName = getSeasonDisplayName(previousSeasonKey);
  const { start: seasonStart, end: seasonEnd } = getSeasonUtcBoundaries(previousSeasonKey);
  const startIso = seasonStart.toISOString();
  const endIso = seasonEnd.toISOString();

  // 2. Check cached season_recaps table first for instant O(1) read
  try {
    const { data: cachedRecap } = await supabase
      .from('season_recaps')
      .select('data')
      .eq('user_id', user.id)
      .eq('season_key', previousSeasonKey)
      .maybeSingle();

    if (cachedRecap?.data) {
      const payload = cachedRecap.data;
      if (payload.totalSeconds === 0) {
        return <EmptyRecapFallback seasonDisplayName={seasonDisplayName} seasonKey={previousSeasonKey} />;
      }
      return (
        <Suspense fallback={<RecapLoading />}>
          <RecapClientWrapper {...payload} />
        </Suspense>
      );
    }
  } catch (cacheErr) {
    // Graceful fallback if table does not exist or network glitch
  }

  // 3. Parallel independent queries via Promise.all
  const [
    profileRes,
    historyRes,
    rpcRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('name, username, rp, season_rp, rank_title, level, last_acknowledged_season, streak_days')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('season_history')
      .select('previous_rank, new_rank, previous_rp, new_rp, season_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .rpc('get_season_recap', {
        p_user_id: user.id,
        p_season_start: startIso,
        p_season_end: endIso,
      }),
  ]);

  const profile = profileRes.data;
  const history = historyRes.data;

  // 4. Resolve aggregated stats: from RPC if succeeded, or via parallel JS aggregation fallback
  let totalSeconds = 0;
  let activeDays = 0;
  let topSubject = 'General Study';
  let topSubjectSeconds = 0;
  let subjectBreakdown: { name: string; seconds: number }[] = [];
  let bestWeekday: string | null = null;
  let peakHour: number | null = 14;
  let completedTasks = 0;

  if (rpcRes.data && typeof rpcRes.data === 'object' && !rpcRes.error) {
    const rpc = rpcRes.data as any;
    totalSeconds = Number(rpc.total_seconds) || 0;
    activeDays = Number(rpc.active_days) || 0;
    topSubject = String(rpc.top_subject || 'General Study');
    topSubjectSeconds = Number(rpc.top_subject_seconds) || 0;
    subjectBreakdown = Array.isArray(rpc.subject_breakdown) ? rpc.subject_breakdown : [];
    bestWeekday = rpc.best_weekday ? String(rpc.best_weekday) : null;
    peakHour = rpc.peak_hour !== undefined ? Number(rpc.peak_hour) : 14;
    completedTasks = Number(rpc.completed_tasks) || 0;
  } else {
    // Fallback parallel queries for local dev, offline, or prior to RPC deployment
    const [sessionsRes, subjectsRes, todosRes] = await Promise.all([
      supabase
        .from('study_sessions')
        .select('duration_seconds, subject_id, started_at')
        .eq('user_id', user.id)
        .gte('started_at', startIso)
        .lt('started_at', endIso),
      supabase
        .from('subjects')
        .select('id, name')
        .eq('user_id', user.id),
      supabase
        .from('todos')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .gte('created_at', startIso)
        .lt('created_at', endIso),
    ]);

    const sessions = sessionsRes.data || [];
    const subjects = subjectsRes.data || [];
    completedTasks = todosRes.data?.length || 0;

    totalSeconds = sessions.reduce((sum, s) => sum + (Number(s.duration_seconds) || 0), 0);

    const subjectMap = new Map<string, number>();
    const activeDates = new Set<string>();
    const weekdaySeconds: Record<string, number> = {};
    const hourCounts: Record<number, number> = {};

    sessions.forEach((s) => {
      const dur = Number(s.duration_seconds) || 0;
      if (s.subject_id) {
        subjectMap.set(s.subject_id, (subjectMap.get(s.subject_id) || 0) + dur);
      }
      if (s.started_at) {
        const d = new Date(s.started_at);
        activeDates.add(d.toISOString().substring(0, 10));
        const dayName = d.toLocaleString('en-US', { weekday: 'long', timeZone: 'UTC' });
        weekdaySeconds[dayName] = (weekdaySeconds[dayName] || 0) + dur;
        const hour = d.getUTCHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    activeDays = activeDates.size;

    // Top subject & breakdown
    let maxSec = 0;
    let maxId = '';
    const breakdownList: { name: string; seconds: number }[] = [];
    for (const [id, sec] of subjectMap.entries()) {
      const name = subjects.find((sub) => sub.id === id)?.name || 'General Study';
      breakdownList.push({ name, seconds: sec });
      if (sec > maxSec) {
        maxSec = sec;
        maxId = id;
      }
    }
    breakdownList.sort((a, b) => b.seconds - a.seconds);
    subjectBreakdown = breakdownList.slice(0, 4);
    topSubjectSeconds = maxSec;
    topSubject = subjects.find((sub) => sub.id === maxId)?.name || (breakdownList[0]?.name ?? 'General Study');

    // Best weekday
    let maxDaySec = 0;
    for (const [day, sec] of Object.entries(weekdaySeconds)) {
      if (sec > maxDaySec) {
        maxDaySec = sec;
        bestWeekday = day;
      }
    }

    // Peak hour
    let maxHourCount = 0;
    for (const [h, count] of Object.entries(hourCounts)) {
      if (count > maxHourCount) {
        maxHourCount = count;
        peakHour = parseInt(h, 10);
      }
    }
  }

  // 5. Zero-session edge case
  if (totalSeconds === 0) {
    return <EmptyRecapFallback seasonDisplayName={seasonDisplayName} seasonKey={previousSeasonKey} />;
  }

  // 6. Rank calculations
  const isFirstSeason = !history;
  const previousRank = history?.previous_rank || null;
  const previousRP = history?.previous_rp || (profile?.rp ? Math.round(profile.rp * 1.5) : 800);
  
  // Starting rank after soft-reset vs current live rank if RP was earned this month
  const softReset = calculateSeasonReset(previousRP);
  const startingRP = history?.new_rp ?? softReset.newRP;
  const currentRank = profile?.rank_title || history?.new_rank || softReset.newTier.fullTitle;
  const currentLiveRP = profile?.season_rp ?? profile?.rp ?? startingRP;

  const payload = {
    seasonKey: previousSeasonKey,
    seasonDisplayName,
    totalSeconds,
    activeDays: Math.max(activeDays, 1),
    topSubject,
    topSubjectSeconds,
    subjectBreakdown,
    bestWeekday,
    peakHour,
    longestStreak: profile?.streak_days || Math.min(activeDays, 7),
    completedTasks,
    previousRank,
    previousRP,
    currentRank,
    startingRP,
    currentLiveRP,
    isFirstSeason,
    username: profile?.name || profile?.username || 'Scholar',
  };

  // 7. Cache in season_recaps table for future sub-100ms primary key lookups
  try {
    await supabase
      .from('season_recaps')
      .upsert({
        user_id: user.id,
        season_key: previousSeasonKey,
        data: payload,
      });
  } catch (saveErr) {
    // Non-fatal if table not created
  }

  return (
    <Suspense fallback={<RecapLoading />}>
      <RecapClientWrapper {...payload} />
    </Suspense>
  );
}
