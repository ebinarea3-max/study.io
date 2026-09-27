export const DAILY_QUOTES = [
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Don't wish it were easier. Wish you were better.", author: "Jim Rohn" },
  { text: "He who has a why to live for can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "Courage is not having the strength to go on; it is going on when you don't have the strength.", author: "Theodore Roosevelt" },
  { text: "The only way to achieve the impossible is to believe it is possible.", author: "Charles Kingsley" },
  { text: "Do not wait; the time will never be 'just right.' Start where you stand.", author: "George Herbert" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "If you want to conquer the anxiety of life, live in the moment, live in the breath.", author: "Amit Ray" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Success is stumbling from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
  { text: "To bear trials with a calm mind robs misfortune of its strength and burden.", author: "Seneca" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.", author: "Bruce Lee" },
  { text: "What we fear doing most is usually what we most need to do.", author: "Tim Ferriss" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "If you spend too much time thinking about a thing, you'll never get it done.", author: "Bruce Lee" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Knowing is not enough, we must apply. Willing is not enough, we must do.", author: "Bruce Lee" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" }
];

export function getDailyQuote(): { text: string; author: string } {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
}
