/**
 * Ground-truth copy for the study.io Welcome Intro Walkthrough and One-Time Page Hints.
 *
 * Source of truth: docs/APP_FACTS.md, strictly overridden by OWNER DECISIONS.
 * Constraint: Headline <= 6 words, Line <= 12 words.
 * Every string is tagged with its source section.
 */

export interface IntroSlideCopy {
  id: string;
  sourceFact: string; // Section reference in docs/APP_FACTS.md or OWNER DECISIONS
  headline: string;
  lineSubject: string;
  lineFocus: string;
}

export interface IntroContentData {
  slides: IntroSlideCopy[];
  buttons: {
    next: string;
    back: string;
    skip: string;
    finish: string;
  };
  premiumNote: {
    sourceFact: string;
    text: string;
    linkLabel: string;
    href: string;
  };
  hints: {
    tasks: {
      sourceFact: string;
      text: string;
    };
    statsSubject: {
      sourceFact: string;
      text: string;
    };
    statsFocus: {
      sourceFact: string;
      text: string;
    };
    leaderboard: {
      sourceFact: string;
      text: string;
    };
    rooms: {
      sourceFact: string;
      text: string;
    };
  };
}

export const INTRO_CONTENT: IntroContentData = {
  slides: [
    // Slide 1: Welcome
    {
      id: 'welcome',
      sourceFact: 'docs/APP_FACTS.md §1 & OWNER DECISIONS [NEEDS OWNER CONFIRMATION: Neutral tagline]',
      headline: 'Welcome to study.io', // 3 words (budget <= 6)
      lineSubject: 'Focus more. Track it. Climb.', // 5 words (budget <= 12)
      lineFocus: 'Focus more. Track it. Climb.', // 5 words (budget <= 12)
    },
    // Slide 2: The Timer
    {
      id: 'timer',
      sourceFact: 'docs/APP_FACTS.md §1 (Stopwatch, Countdown, Pomodoro 25/5 & 50/10) & OWNER DECISIONS',
      headline: 'Focus with the timer', // 4 words (budget <= 6)
      lineSubject: 'Pick a mode and track your session.', // 7 words (budget <= 12)
      lineFocus: 'Just press start and focus.', // 5 words (budget <= 12)
    },
    // Slide 3: Ranks and RP
    {
      id: 'ranks',
      sourceFact: 'OWNER DECISIONS: "100 RP per hour of focus" & docs/APP_FACTS.md §2 (23 ranks)',
      headline: 'Climb through 23 ranks', // 4 words (budget <= 6)
      lineSubject: 'Earn 100 RP for every hour you focus.', // 8 words (budget <= 12)
      lineFocus: 'Earn 100 RP for every hour you focus.', // 8 words (budget <= 12)
    },
    // Slide 4: Seasons and Leaderboard
    {
      id: 'seasons',
      sourceFact: 'OWNER DECISIONS: Monthly soft-reset restart a few divisions lower & docs/APP_FACTS.md §3, §6',
      headline: 'Monthly seasons and leaderboards', // 4 words (budget <= 6)
      lineSubject: 'Ranks soft-reset each month so everyone climbs again.', // 8 words (budget <= 12)
      lineFocus: 'Ranks soft-reset each month so everyone climbs again.', // 8 words (budget <= 12)
    },
    // Slide 5: Days in a row and levels
    {
      id: 'streaks',
      sourceFact: 'OWNER DECISIONS: "Study a little every day to keep your streak and level up" & docs/APP_FACTS.md §4, §5',
      headline: 'Build your streak and level', // 5 words (budget <= 6)
      lineSubject: 'Study a little every day to keep your streak and level up.', // 12 words (budget <= 12)
      lineFocus: 'Study a little every day to keep your streak and level up.', // 12 words (budget <= 12)
    },
    // Slide 6: Study rooms
    {
      id: 'rooms',
      sourceFact: 'OWNER DECISIONS: 6-char code, up to 100 members, optional password & docs/APP_FACTS.md §7',
      headline: 'Study together in rooms', // 4 words (budget <= 6)
      lineSubject: 'Join with a six-character code or create your own.', // 9 words (budget <= 12)
      lineFocus: 'Join with a six-character code or create your own.', // 9 words (budget <= 12)
    },
    // Slide 7: Make it yours
    {
      id: 'customize',
      sourceFact: 'OWNER DECISIONS: 18 themes (11 free, 7 premium), 8 sounds all free & docs/APP_FACTS.md §11, §12',
      headline: 'Personalize your focus space', // 4 words (budget <= 6)
      lineSubject: 'Choose from 18 themes and 8 ambient focus sounds.', // 9 words (budget <= 12)
      lineFocus: 'Choose from 18 themes and 8 ambient focus sounds.', // 9 words (budget <= 12)
    },
  ],

  buttons: {
    next: 'Next',
    back: 'Back',
    skip: 'Skip',
    finish: 'Start studying',
  },

  premiumNote: {
    sourceFact: 'OWNER DECISIONS: Premium summary line strictly bounded to allowed features only',
    text: 'Premium adds extra themes, animated scenes, full history, daily goals and more.',
    linkLabel: 'Learn more',
    href: '/premium',
  },

  hints: {
    tasks: {
      sourceFact: 'OWNER DECISIONS & docs/APP_FACTS.md §9 (Tasks overview)',
      text: 'Paste a list to add many tasks at once.',
    },
    statsSubject: {
      sourceFact: 'OWNER DECISIONS & docs/APP_FACTS.md §10 (Subject mode analytics)',
      text: 'See where your focus time goes.',
    },
    statsFocus: {
      sourceFact: 'OWNER DECISIONS & docs/APP_FACTS.md §10 (Focus mode analytics)',
      text: 'See your total focus time here.',
    },
    leaderboard: {
      sourceFact: 'OWNER DECISIONS & docs/APP_FACTS.md §6 (Leaderboard ranking criteria)',
      text: 'Rankings use total focus time. Switch the period at the top.',
    },
    rooms: {
      sourceFact: 'OWNER DECISIONS & docs/APP_FACTS.md §7 (Study rooms joining & creation)',
      text: 'Join a room to study alongside others, or create your own.',
    },
  },
};
