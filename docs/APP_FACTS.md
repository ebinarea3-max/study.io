# study.io — Ground Truth Application Facts & Technical Specification

> **Notice:** This document is compiled strictly from source code analysis of the application and its database migrations as of November 2026. Every fact is cited with file paths and line/function references. No assumptions, guesses, or marketing claims are included.

---

## 1. Timer
- **Modes**: Three active timer modes: `stopwatch`, `countdown`, and `pomodoro` (`src/types/index.ts:189`, `src/context/StudyContext.tsx:442-450`).
- **Pomodoro Presets & Phases**:
  - Two presets: `'25/5'` (25 min focus / 5 min short break) and `'50/10'` (50 min focus / 10 min short break) (`src/types/index.ts:193`, `src/context/StudyContext.tsx:486-503`).
  - Three phases: `'work'`, `'shortBreak'`, and `'longBreak'` (`src/types/index.ts:191`).
  - Changing presets while the timer is actively running is blocked with a console warning (`src/context/StudyContext.tsx:506-510`).
- **Countdown Presets & Limits**:
  - Default countdown target if not configured: 3,600 seconds (1 hour) (`src/context/StudyContext.tsx:463`).
  - Limits enforced in `CountdownEditor`: Hours: 0 to 24 hr (`maxVal: 24`); Minutes: 0 to 59 min (`maxVal: 59`); Seconds: 0 to 59 sec (`maxVal: 59`) (`src/components/timer/CountdownEditor.tsx:280-320`).
  - Minimum countdown duration: 60 seconds (1 minute). Durations under 60 seconds disable the save button with the warning *"Pick at least 1 minute"* (`src/components/timer/CountdownEditor.tsx:202-205, 332`).
- **What Counts as a Saved Session**:
  - Any completed session with `duration > 0` seconds is saved to Supabase `study_sessions` (or queued in `localStorage` if offline) (`src/context/StudyContext.tsx:3177, 3210-3240`).
- **Minimum Duration for RP & XP**:
  - Minimum duration to save to database: `duration > 0` (`src/context/StudyContext.tsx:3177`).
  - Minimum duration to earn Rank Points (RP) or Focus XP: **60 seconds (1 minute)** (`src/lib/rankedSystem.ts:528-548`, `src/context/StudyContext.tsx:3084-3087`). Sessions under 60 seconds award strictly 0 RP and 0 XP.
- **Pause / Resume / Stop Behavior**:
  - **Pause** (`pauseTimer`): Freezes the interval, preserves accumulated time in `accumulatedSecondsRef.current`, sets `isPaused = true`, pushes `status: 'paused'` to Supabase table `active_sessions`, and broadcasts to peer tabs/devices (`src/context/StudyContext.tsx:2730-2755`).
  - **Resume** (`resumeTimer`): Restarts the interval timestamp (`startTimeRef.current = Date.now()`), sets `isPaused = false`, pushes `status: 'running'` to `active_sessions`, and broadcasts (`src/context/StudyContext.tsx:2758-2795`).
  - **Stop** (`stopTimer`): Clears the interval, calls `syncActiveSessionToDb('stopped')` (which executes the `stop_session` RPC), writes the record to `study_sessions`, calculates earned XP and RP, updates the profile, and opens the Rank Settlement Modal (`src/context/StudyContext.tsx:3166-3250`).
- **Cross-Device Sync**:
  - Uses the Supabase Postgres table `active_sessions` (`user_id`, `status`, `started_at`, `accumulated_seconds`, `subject_id`, `subject_name`, `mode`, `pomodoro_phase`, `updated_at`) (`src/context/StudyContext.tsx:1468-1675`).
  - Real-time peer broadcast: Uses Supabase Realtime channel `study_rooms_realtime_hub` (`event: peer_session_sync`, latency < 50ms) (`src/context/StudyContext.tsx:1542-1546`).
  - Local cross-tab sync: Uses `new BroadcastChannel('studyio_timer')` (`src/context/StudyContext.tsx:523, 1087, 1122`).
  - Heartbeat: A background pulse broadcasts every 3 seconds while studying (`src/context/StudyContext.tsx:1983-2006`).
  - Window focus / `visibilitychange`: Refetches `active_sessions` on tab return to eliminate desynchronization (`src/context/StudyContext.tsx:1864-1920`).

---

## 2. RP and Ranks
- **Exact RP Formula**:
  - Base conversion rate:
    - 1 Hour of Focus = 100 RP (`src/lib/rankedSystem.ts:8`)
    - 1 Minute of Focus = ~1.67 RP (`100 / 60`) (`src/lib/rankedSystem.ts:9`)
    - 1 Second of Focus = 1 / 36 RP (`src/lib/rankedSystem.ts:10`)
  - Session RP gained: `Math.floor(safeDuration / 36)` (`src/lib/rankedSystem.ts:553`).
  - Unified Monthly Formula: `Season RP = Carryover RP + Math.floor(Current Month Focus Seconds / 36)` (`src/lib/rankedSystem.ts:13`).
  - Threshold gate: Sessions under 60 seconds award strictly 0 RP (`src/lib/rankedSystem.ts:537-548`).
  - Bonuses: `goalStreakBonus` is hardcoded to 0; `taskBonus` is hardcoded to 0 (`src/lib/rankedSystem.ts:559-561`).
  - Multipliers: None for RP.
  - Penalties: None (focus time is strictly additive).
  - Hard reset carryover cap: 26,000 RP (Diamond IV) (`src/lib/rankedSystem.ts:50`).
- **Full Tier & Division List (23 Ranks in Order)** (`src/lib/rankedSystem.ts:52-455`):
  1. **Bronze I**: 0 – 99 RP
  2. **Bronze II**: 100 – 299 RP
  3. **Bronze III**: 300 – 499 RP
  4. **Bronze IV**: 500 – 799 RP
  5. **Silver I**: 800 – 1,099 RP
  6. **Silver II**: 1,100 – 1,499 RP
  7. **Silver III**: 1,500 – 1,999 RP
  8. **Silver IV**: 2,000 – 2,799 RP
  9. **Gold I**: 2,800 – 3,799 RP
  10. **Gold II**: 3,800 – 4,999 RP
  11. **Gold III**: 5,000 – 6,399 RP
  12. **Gold IV**: 6,400 – 7,999 RP
  13. **Platinum I**: 8,000 – 9,799 RP
  14. **Platinum II**: 9,800 – 11,799 RP
  15. **Platinum III**: 11,800 – 13,999 RP
  16. **Platinum IV**: 14,000 – 16,499 RP
  17. **Diamond I**: 16,500 – 19,299 RP
  18. **Diamond II**: 19,300 – 22,499 RP
  19. **Diamond III**: 22,500 – 25,999 RP
  20. **Diamond IV**: 26,000 – 29,999 RP
  21. **Champion**: 30,000 – 34,499 RP
  22. **Master**: 34,500 – 39,999 RP
  23. **Grandmaster**: 40,000+ RP
- **Movement Up or Down**:
  - **Climbing**: Continuous and strictly monotonic as current month focus time increases.
  - **Demotion**: Users cannot be demoted during an active season. Demotion occurs strictly at the monthly season soft reset.

---

## 3. Seasons
- **Duration**: Exactly one calendar month. Season IDs follow the UTC `YYYY-MM` format (e.g. `2026-11`) (`src/lib/rankedSystem.ts:602-606`).
- **Exact Reset Rule**:
  - At the start of a new month, a soft reset is computed from the user's previous season tier (`src/lib/rankedSystem.ts:578-598, 620-730`).
  - `startingRP = Math.min(HARD_RESET_CAP_RP, matchedTier.softResetRP)` (hard cap = 26,000 RP).
  - Reset mapping table:
    - Bronze I & II &rarr; 0 RP (Bronze I)
    - Bronze III &rarr; 100 RP (Bronze II)
    - Bronze IV &rarr; 300 RP (Bronze III)
    - Silver I &rarr; 500 RP (Bronze IV)
    - Silver II &rarr; 800 RP (Silver I)
    - Silver III &rarr; 1,100 RP (Silver II)
    - Silver IV &rarr; 1,500 RP (Silver III)
    - Gold I &rarr; 1,500 RP (Silver III)
    - Gold II &rarr; 2,000 RP (Silver IV)
    - Gold III &rarr; 2,800 RP (Gold I)
    - Gold IV &rarr; 3,800 RP (Gold II)
    - Platinum I &rarr; 5,000 RP (Gold III)
    - Platinum II &rarr; 6,400 RP (Gold IV)
    - Platinum III &rarr; 8,000 RP (Platinum I)
    - Platinum IV &rarr; 9,800 RP (Platinum II)
    - Diamond I &rarr; 11,800 RP (Platinum III)
    - Diamond II &rarr; 14,000 RP (Platinum IV)
    - Diamond III &rarr; 16,500 RP (Diamond I)
    - Diamond IV &rarr; 19,300 RP (Diamond II)
    - Champion &rarr; 22,500 RP (Diamond III)
    - Master &rarr; 26,000 RP (Diamond IV)
    - Grandmaster &rarr; 26,000 RP (Diamond IV)
- **When Season Recap Appears**:
  - Triggers on app mount when `currentSeasonId` in user profile does not match the current calendar month, or when Supabase RPC `check_and_apply_season_reset` reports `needs_reset: true` (`src/context/StudyContext.tsx:730-860`).
  - Renders `SeasonRecapBanner` at the top of the interface (`src/components/gamification/SeasonRecapBanner.tsx`).
  - Clicking the banner navigates to `/recap`, presenting a multi-slide review (`RecapPresentation.tsx`: total hours, top subject, power day, consistency, rank reset comparison, and shareable season card).
  - Acknowledgment is stored in `localStorage` (`has_seen_recap_<season>`) and synced to `profiles.last_acknowledged_season`.

---

## 4. Streaks
- **What Counts as a Streak Day**: Any calendar day on which at least one focus session with `durationSeconds > 0` was logged (`src/lib/mockData.ts:153-162`). There is no minimum minutes threshold.
- **What Breaks the Streak**:
  - If neither **today** nor **yesterday** contains a completed focus session (`!studyDates.has(todayStr) && !studyDates.has(yesterdayStr)`), the streak resets to 0 (`src/lib/mockData.ts:169-174`).
  - If yesterday had a session but today does not yet, the streak is maintained pending today's session.
- **Timezone Used**: The user's local system timezone, evaluated via `Date.getFullYear()`, `Date.getMonth() + 1`, and `Date.getDate()` (`src/lib/mockData.ts:155-159`).
- **"Daily Consistency Multiplier"**:
  - **Does not exist as a multiplier in code.**
  - Instead, the daily consistency incentive is a flat **+100 XP bonus** awarded to lifetime XP on the user's first valid session (&ge; 60 seconds) of the calendar day (`src/context/StudyContext.tsx:3085-3089`, `src/lib/gamification.ts:18`).

---

## 5. Levels and Titles
- **Level Formula & Rules** (`src/lib/gamification.ts:8-75`):
  - Focus XP earn rate: 10 XP per full minute of recorded focus time: `Math.floor(duration_seconds / 60) * 10`.
  - Duration gate: Sessions under 60 seconds award 0 XP.
  - Tasks check-off: Awards strictly 0 XP (`calculateTodoXP` returns 0).
  - First valid session (&ge; 60s) of day: Awards +100 XP streak bonus.
  - Lifetime XP: Uncapped, permanently accumulated in database, never resets across seasons.
  - Level calculation: `Level = Math.floor(Math.pow(lifetimeXP / 60, 1 / 2.4)) + 1`.
  - Cumulative XP required for Level $L$: `Math.floor(60 * Math.pow(level - 1, 2.4))`. Calibrated so Level 100 requires ~3.9M XP (~6,500 focus hours).
- **Scholar Titles by Level** (`src/lib/gamification.ts:80-90`):
  - Levels 1 – 9: **Novice Scholar**
  - Levels 10 – 24: **Apprentice Mind**
  - Levels 25 – 49: **Adept Inquirer**
  - Levels 50 – 74: **Master Polymath**
  - Levels 75 – 99: **Grand Philosopher**
  - Levels 100 – 149: **Eternal Archon**
  - Levels 150 – 199: **Cosmic Sage**
  - Levels 200+: **Transcendent Myth**

---

## 6. Leaderboard
- **Periods (Timeframes)**: 4 tabs (`src/components/leaderboard/MonthlyLeaderboard.tsx:108`):
  - `'today'`: Current day starting from local midnight (`00:00:00`).
  - `'week'`: Current week starting from Monday midnight (`00:00:00`).
  - `'month'`: Current calendar month starting from the 1st (Default).
  - `'all'`: All-time accumulated focus.
- **Ranking Criterion**: Total focus seconds (`total_seconds`) in descending order (`src/components/leaderboard/MonthlyLeaderboard.tsx:547`).
- **Tie Handling**: In client sorting, `entries.sort((a, b) => b.total_seconds - a.total_seconds)`. No secondary tie-breaker exists; ties retain database query return order.
- **Row Contents** (`src/components/leaderboard/LeaderboardRow.tsx:28-200`):
  - Numerical rank position (#1, #2, #3 have gold/silver/bronze badges).
  - Rank movement trend indicator (&uarr; green, &darr; red, &ndash; gray compared against snapshot).
  - Scholar avatar with optional Pro gold flair frame.
  - Display name, verified checkmark, and `@username`.
  - Scholar Level & Title (e.g. `Lv. 10 Novice Scholar`).
  - Rank crest badge & Title (e.g. `SILVER III`).
  - Total focus time in hours and minutes (`Xh Ym`).
  - Clicking any row opens that user's `ScholarProfileModal`.

---

## 7. Study Rooms
- **Creation & Joining** (`src/components/rooms/StudyRoomsTab.tsx:110-140, 350-410`):
  - Any authenticated user can create a study room.
  - Room name, optional password, and member capacity.
  - Generates a unique 6-character alphanumeric uppercase short code (`Math.random().toString(36).substring(2, 8).toUpperCase()`, line 370).
  - Joining: Users can join public rooms with one click from the lobby, or enter a 6-character short code or room ID.
- **Public vs Password-Protected**:
  - **Public**: `is_private = false`, `password = null`. Any user can enter directly.
  - **Password-Protected**: `is_private = true`, prompts user to input room password before joining (`StudyRoomsTab.tsx:635-645`).
- **Capacity**:
  - Default: 4 members (`StudyRoomsTab.tsx:118`).
  - Range: Minimum 2 members (or current member count), Maximum 100 members (`StudyRoomsTab.tsx:1968-1982`). Presets: 4, 8, 16, 32, 50, 100.
  - Joining is blocked when `currentCount >= max_capacity` (`StudyRoomsTab.tsx:633`).
- **Member Visibility Inside Rooms** (`src/components/rooms/ActiveRoom.tsx:1200-1450`):
  - Avatar, display name, `@username`, verified badge.
  - Live study state: `is_studying` (Studying vs Idle/Resting with live pulsing status indicator).
  - Live elapsed timer ticking in real-time.
  - Today's cumulative focus time.
  - Current subject being studied (subject name & color chip).
  - Room text chat with real-time messages and timestamps.
  - Clicking a member opens their `ScholarProfileModal`.

---

## 8. Study Modes (Focus vs Subject)
- **Status**: Implemented (`src/context/StudyModeContext.tsx`, `src/lib/defaultSubjectResolver.ts`, `src/components/onboarding/StudyModeOnboarding.tsx`, `src/components/settings/SettingsStudyModeSection.tsx`).
- **Behavior**:
  - **Focus Mode**: Hides all subject pickers, chips, and management controls across Timer and Tasks. The timer runs under a default "General Focus" subject internally so all database schemas, session saves, RP gains, and analytics remain intact. Start button reads *"Start focus"*.
  - **Subject Mode**: Standard full behavior with subject selector, colored subject tags, and per-subject time allocations.
- **Onboarding & Settings**:
  - New users are prompted with `StudyModeOnboarding` on first sign-in (blocks the app until chosen).
  - Existing users are backfilled to `'subject'` and do not see the onboarding modal.
  - Any user can switch modes anytime in Settings under "Study mode" via a confirmation dialog explaining data preservation (switching is disabled during an active or paused timer session).
  - Stored in the database column `profiles.study_mode` (`check in ('focus', 'subject')`) and updated via security-definer RPC `set_my_study_mode(p_mode)`.

---

## 9. Tasks
- **Features** (`src/components/todo/DailyTodoList.tsx`, `src/components/todo/TasksOverview.tsx`, `src/components/timetable/WeeklyTimetable.tsx`):
  - **Priority**: Three levels: `'low'`, `'medium'`, and `'high'` (default: `'medium'`) (`DailyTodoList.tsx:29, 40`).
  - **Filters**: Four tabs: `'all'`, `'active'`, `'completed'`, and `'high'` (`DailyTodoList.tsx:55`).
  - **Subject Association**: Optional association to a user's subject (hidden in Focus mode).
  - **Smart Paste**: `smartTaskParser.ts` detects multi-line pastes, parses task titles, identifies priority keywords (`!high`, `p1`, `urgent`), and automatically links matching subjects.
  - **Reordering**: Drag-and-drop reordering with position indicators (`DailyTodoList.tsx:68-120`).
  - **"Focus on this"**: Clicking the Play button sets the active subject to the task's subject and directs focus to the timer.
  - **Weekly Timetable**: Allows scheduling daily planned study hours by day of the week (MON – SUN), tracking planned vs logged hours, and copying routines across days.

---

## 10. Stats
- **Charts & Modules** (`src/components/analytics/AnalyticsDashboard.tsx`):
  - **Sector Time Allocation**: Donut chart and breakdown table of time per subject with Daily, Weekly, Monthly, and Yearly timeframe selectors.
  - **Target Discipline Matrix**: Monthly calendar grid displaying active study days (colored dots for days with logged sessions) and target clearance rate.
  - **Focus Trends**: Bar chart showing historical focus hours against the user's daily goal line.
  - **24-Hour Timeline** (`StudyTimeline24h.tsx`): Visual hourly block timeline of sessions logged throughout the day.
- **Free vs Premium Limits**:
  - Free users can only inspect the **current day's** Sector Time Allocation (`dateKey === todayStr`) and the **current calendar month** (`AnalyticsDashboard.tsx:407, 530`).
  - Navigating to historical days/weeks/months/years in Sector Time Allocation is blocked for free users (`toast: Historical analytics navigation requires study.io Premium`).
  - Clicking any date other than today on the calendar opens the Premium modal (`AnalyticsDashboard.tsx:530-535`).
  - Navigating to past or future calendar months opens the Premium modal (`AnalyticsDashboard.tsx:545-565`).
  - Navigating past periods on the focus trends chart opens the Premium modal (`AnalyticsDashboard.tsx:676-685`).

---

## 11. Atmosphere Sounds, Fullscreen Focus Mode, and Focus Scenes
- **Atmosphere Sounds (8 Options)** (`src/components/focus/useAtmosphere.ts:16-25`):
  1. `none`: **Silent** ("Pure quiet focus") — Category: `silent`
  2. `rain`: **Gentle Rain** ("Calming rainfall on rooftop") — Category: `nature`
  3. `campfire`: **Campfire** ("Warm crackling hearth flame") — Category: `nature`
  4. `waves`: **Ocean Waves** ("Rhythmic coastal tide") — Category: `nature`
  5. `lofi`: **Lo-Fi Chill** ("Mellow beats for deep focus") — Category: `music`
  6. `brownnoise`: **Brown Noise** ("Deep low-frequency rumble") — Category: `noise`
  7. `pinknoise`: **Pink Noise** ("Balanced soothing static") — Category: `noise`
  8. `whitenoise`: **White Noise** ("Crisp masking frequency") — Category: `noise`
  - Default volume: 0.5 (50%) (`useAtmosphere.ts:34`). All 8 sounds are free.
- **Fullscreen Focus Mode** (`src/components/focus/FocusModeModal.tsx`):
  - Full-screen immersion modal featuring canvas background animations, clock dial, atmosphere controls, scene selector, and keyboard shortcuts (`F` for fullscreen, `ESC` to close).
- **Focus Scenes** (`src/components/focus/scenes/registry.ts:13-72`):
  1. `default`: **Default** — Free (`premium: false`)
  2. `dusk`: **Dusk peaks** — Premium (`premium: true`)
  3. `forest`: **Moonlit forest** — Premium (`premium: true`)
  4. `neon`: **Neon skyline** — Premium (`premium: true`)
  5. `sakura`: **Sakura night** — Premium (`premium: true`)
  6. `campfire`: **Campfire night** — Premium (`premium: true`)
  *(Note: 4 legacy scenes are marked `disabled: true`: `sea`, `aurora`, `rain`, `stars`)*.

---

## 12. Themes
- **Total Themes**: 18 themes (`src/lib/themes.ts:15-175`).
- **Free Themes (11)**:
  1. `rank`: **Rank colors** (Follows rank crest) — Dark [Default]
  2. `midnight`: **Midnight** (Cool blue on deep navy) — Dark
  3. `ember`: **Ember** (Warm amber on charcoal) — Dark
  4. `ocean`: **Ocean** (Clear cyan on deep sea) — Dark
  5. `rose`: **Rose** (Soft pink on dark plum) — Dark
  6. `nebula`: **Nebula** (Violet on cosmic dark) — Dark
  7. `graphite`: **Graphite** (Pure monochrome) — Dark
  8. `paper`: **Paper** (Bright and warm) — Light
  9. `cyberpunk`: **Cyberpunk** (Electric neon cyan & fuchsia) — Dark
  10. `amethyst`: **Amethyst** (Luminous royal violet) — Dark
  11. `emerald`: **Emerald** (Imperial luminous jade) — Dark
- **Premium Themes (7)**:
  1. `goldleaf`: **Gold Leaf** (Warm gold on dark leather) — Dark
  2. `crimson`: **Crimson** (Deep red on near black) — Dark
  3. `sakura`: **Sakura** (Delicate cherry blossom on twilight ink) — Dark
  4. `espresso`: **Espresso** (Warm roasted caramel on dark cocoa) — Dark
  5. `forest`: **Forest** (Calm green on dark moss) — Dark
  6. `abyss`: **OLED Abyss** (True pitch black) — Dark
  7. `matcha`: **Matcha** (Creamy green tea, warm pastel) — Light
- **Theme Gating Behavior**: If a non-premium user has a premium theme stored, `ThemeContext` falls back to `rank` in memory without wiping `localStorage` (`src/context/ThemeContext.tsx:60-75`).

---

## 13. Daily Goals and Goal Streaks
- **Limits & Behavior** (`src/context/FocusGoalContext.tsx:145-185`):
  - Setting focus goals is a **Premium** feature (`FocusGoalContext.tsx:90-95`). Free users cannot save goals.
  - Enforced limits:
    - Daily goal: 5 to 720 minutes (5 minutes to 12 hours) (`clampedDaily = Math.min(Math.max(dailyMinutes, 5), 720)`).
    - Weekly goal: 30 to 5,040 minutes (30 minutes to 84 hours) (`weeklyMinutes = Math.min(Math.max(weeklyHours * 60, 30), 5040)`).
  - Storage: Saved to Supabase table `focus_goals`.
  - Notification: Reaching the daily goal triggers a toast: `"Daily goal reached"` with 🎯 icon, throttled to once per day via `localStorage` (`studypulse_goal_reached_${userId}_${todayKey}`) (`FocusGoalContext.tsx:55-80`).
- **Goal Streak Calculation** (`src/lib/mockData.ts:193-248`):
  - Tracks consecutive calendar days where focus seconds &ge; daily goal target.
  - If yesterday's goal was met, streak is preserved pending today's progress.
  - Once today's target is reached, the streak increments by 1.
  - If neither today nor yesterday reached the target, the goal streak resets to 0.

---

## 14. Premium
- **Full List of Premium Features**:
  1. **7 Exclusive Themes**: Gold Leaf, Crimson, Sakura, Espresso, Forest, OLED Abyss, Matcha (`src/lib/themes.ts`).
  2. **5 Animated Focus Scenes**: Dusk peaks, Moonlit forest, Neon skyline, Sakura night, Campfire night (`src/components/focus/scenes/registry.ts`).
  3. **Historical Analytics**: Historical day-by-day navigation, clicking past dates on calendar, browsing past months, and historical trend comparisons (`src/components/analytics/AnalyticsDashboard.tsx`).
  4. **Focus Goals & Goal Streaks**: Setting daily and weekly study targets and tracking continuous goal streaks (`src/context/FocusGoalContext.tsx`).
  5. **Scholar Profile & Leaderboard Flair**: Verified Pro membership badge and gold crown flair frame on leaderboard rows and scholar profile modal (`src/lib/flair.ts`).
  6. **Deep Analytics Tiles**: Weekly Report Card and AI/Study Insights tiles (`src/components/analytics/WeeklyReportCard.tsx`, `StudyInsights.tsx`).
- **What Free Users Receive**:
  - Full access to 11 themes, default focus scene, all 8 atmosphere soundscapes, all 3 timer modes, unlimited public and private study rooms, daily tasks checklist, weekly timetable planner, ranked seasonal progression, leaderboard visibility, and current-day analytics breakdown.
- **Payment Status (Live vs "Coming Soon")**:
  - Integration is implemented with Razorpay (`src/hooks/useRazorpayCheckout.ts`, `src/app/api/billing/plans/route.ts`, `/api/billing/create-subscription`).
  - Configured pricing: Monthly plan is `₹499` / month; Yearly plan is `₹4,999` / year (`src/components/premium/PremiumModal.tsx:70-71`).
  - Operational state: If the environment variables `RAZORPAY_PLAN_ID_MONTHLY` and `RAZORPAY_PLAN_ID_YEARLY` are not set in the hosting environment, `/api/billing/plans` returns `{ configured: false }` (`src/app/api/billing/plans/route.ts:50-60`).

---

## 15. Settings
- **Sections in Settings Modal** (`src/components/common/SettingsModal.tsx`):
  1. **Plan Section** (`SettingsPlanSection.tsx`): Shows current tier (Free vs Pro Scholar), billing expiration date, and an Upgrade / Manage button.
  2. **Appearance** (`ThemePicker.tsx`): Shows all 18 theme choices with preview color swatches and dark/light mode tags.
  3. **Study Mode** (`SettingsStudyModeSection.tsx`): Allows switching between Focus mode and Subject mode with a confirmation dialog explaining data safety.
  4. **Account & Avatar**: Displays avatar, display name, `@username`, email, Pro badge, and "Cloud Synced" status.
  5. **Audio & Focus Synthesizer**: Displays sound status and includes a "TEST CHIMES" button.
  6. **Install App / Progressive Web App**: Shows PWA installation status or "INSTALL APP" / "ADD TO HOME" button.
  7. **Report a Problem**: In-app feedback form with 4 category tags (`Bug`, `Timer`, `UI Glitch`, `Feedback`), description text area, optional screenshot file upload to Supabase storage bucket `feedback_screenshots`, and submission to `feedback_reports` table.
  8. **Danger Zone**: Account deletion workflow requiring the user to type their exact email address to confirm permanent purging of all records.

---

## 16. Sign-in Methods and Profile Fields
- **Sign-in Methods**:
  - **In UI**: Only **Google OAuth** ("Continue with Google") is rendered in the sign-in modal/page (`src/components/common/AuthCard.tsx:100-150`).
  - **In Code**: Functions `signInWithEmail(email, pass)` and `signUpWithEmail(email, pass, name)` exist in `AuthContext.tsx:515-630` utilizing Supabase Auth password methods, but no UI input fields exist for email/password login.
- **Profile Fields** (`src/types/index.ts:53-95`, `schema.sql:6-19`, and SQL migrations):
  - `id` (uuid, primary key, references `auth.users`)
  - `name` / `displayName` (text)
  - `username` (text, unique)
  - `avatar_url` (text)
  - `daily_goal_hours` (numeric, default 4.0)
  - `streak_days` (integer, default 0)
  - `level` (integer, default 1)
  - `xp` / `lifetime_xp` (bigint, default 0)
  - `total_study_seconds` (bigint, default 0)
  - `current_season_id` (text, default `'YYYY-MM'`)
  - `season_rp` (integer, default 0)
  - `season_base_rp` / `carryover_rp` (integer, default 0)
  - `rank_title` (text)
  - `last_streak_bonus_date` (text, format `YYYY-MM-DD`)
  - `last_acknowledged_season` (text)
  - `study_mode` (text, check constraint `'focus'` or `'subject'`)
  - `created_at` (timestamptz)

---

## 17. Contradictions, Dead Code, and Items for Owner Confirmation

1. **Missing `study_mode` Column in Remote Database**:
   - Migration `study_mode_migration.sql` was prepared for Phase A, but a screenshot from the Supabase SQL editor (`select count(*) from public.profiles where study_mode is null;`) produced `ERROR: 42703: column "study_mode" does not exist`. The owner must execute `study_mode_migration.sql` in Supabase for the database column and RPCs to exist in production.
2. **Type Definition vs Implementation in Rank Points**:
   - In `src/types/index.ts:114-118`, the type comments describe: `sessionRP: 10 RP per focused minute`, `goalStreakBonus: +50 RP`, and `taskBonus: +10 RP`.
   - In actual code (`src/lib/rankedSystem.ts:530-565`), the V2 system awards `Math.floor(seconds / 36)` (~1.67 RP/min), and `goalStreakBonus` and `taskBonus` are hard-coded to return `0`. Tasks and goals do not grant RP in the active engine.
3. **Task XP Discrepancy**:
   - `src/lib/gamification.ts:12-14` states: *"Tasks: Completing/checking off tasks awards 0 XP"* and `calculateTodoXP()` returns `0`. However, `todoXP` is still declared in the `LevelProgress` TypeScript interface (`src/lib/gamification.ts:54`).
4. **"Daily Consistency Multiplier" Phrasing**:
   - Product copy frequently mentions a "daily consistency multiplier", but no multiplicative calculation exists in the codebase. It is strictly a flat +100 XP bonus added on the first valid session (&ge; 60s) of each day.
5. **Hardcoded Fallbacks for Specific Accounts**:
   - In `src/lib/rankedSystem.ts:685-691`, `resolveUserSeasonReset()` contains hardcoded fallback values for usernames `'trial'` (Silver IV / 2,468 RP) and `'wren'` (Silver II / 1,455 RP) when study session histories have not hydrated.
6. **Disabled Focus Scenes in Registry**:
   - Four scenes (`sea`, `aurora`, `rain`, `stars`) in `src/components/focus/scenes/registry.ts:60-100` are flagged with `disabled: true` and superseded by `sakura` and `campfire`.
7. **Email/Password Auth Dead Code**:
   - `AuthContext.tsx:515-630` maintains complete implementations of `signInWithEmail` and `signUpWithEmail`, but `AuthCard.tsx` only exposes a Google OAuth button. Email/password authentication is unreachable by end users.
8. **Razorpay Environment Gating**:
   - `/api/billing/plans` falls back to returning `{ configured: false }` if `RAZORPAY_PLAN_ID_MONTHLY` and `RAZORPAY_PLAN_ID_YEARLY` are missing in production environment variables.
