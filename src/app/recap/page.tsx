import { createClient } from '../../lib/supabaseServer';
import { redirect } from 'next/navigation';
import RecapPresentation from '../../components/recap/RecapPresentation';

export default async function RecapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // 1. Get total study seconds for this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  const { data: sessions, error: sessionsError } = await supabase
    .from('study_sessions')
    .select('duration_seconds, subject_id')
    .eq('user_id', user.id)
    .gte('started_at', startOfMonth);

  if (sessionsError || !sessions || sessions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/95 text-white font-hud tracking-widest text-xl text-center px-4">
        NOT ENOUGH DATA YET
      </div>
    );
  }

  // Aggregate total seconds
  const totalSeconds = sessions.reduce((sum, s) => sum + (Number(s.duration_seconds) || 0), 0);

  // Find most studied subject
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('user_id', user.id);

  const subjectMap = new Map<string, number>();
  sessions.forEach(s => {
    if (s.subject_id) {
      subjectMap.set(s.subject_id, (subjectMap.get(s.subject_id) || 0) + (Number(s.duration_seconds) || 0));
    }
  });

  let topSubjectId = '';
  let topSubjectSeconds = 0;
  for (const [id, seconds] of subjectMap.entries()) {
    if (seconds > topSubjectSeconds) {
      topSubjectSeconds = seconds;
      topSubjectId = id;
    }
  }
  
  const topSubjectName = subjects?.find(sub => sub.id === topSubjectId)?.name || 'Unknown';

  // Fetch Profile for rank/RP
  const { data: profile } = await supabase
    .from('profiles')
    .select('rp, season_rp, rank_title, level')
    .eq('id', user.id)
    .maybeSingle();

  // Attempt to fetch recent reset data from season_history
  const { data: history } = await supabase
    .from('season_history')
    .select('previous_rank, new_rank')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // If history exists, use it. Otherwise, force mock data for testing.
  const previousRank = history?.previous_rank || "SILVER I";
  const currentRank = history?.new_rank || profile?.rank_title || "BRONZE III";
  
  // Force this to false so the UI always plays the Peak -> Drop -> Grind sequence
  const isFirstSeason = false;

  return (
    <RecapPresentation 
      totalSeconds={totalSeconds}
      topSubject={topSubjectName}
      topSubjectSeconds={topSubjectSeconds}
      rp={profile?.season_rp || profile?.rp || 0}
      rankTitle={profile?.rank_title || 'BRONZE I'}
      level={profile?.level || 1}
      previousRank={previousRank}
      currentRank={currentRank}
      isFirstSeason={isFirstSeason}
    />
  );
}
