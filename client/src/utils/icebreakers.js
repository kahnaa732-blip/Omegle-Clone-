/**
 * Curated list of engaging icebreakers and conversation starters
 */
export const ICEBREAKERS = [
  "What is the most memorable trip or adventure you've ever had?",
  "If you had $10,000 to spend in the next 24 hours, what would you do with it?",
  "What is the most underrated movie, show, or game in your opinion?",
  "Would you rather explore deep space or the unexplored bottom of the ocean?",
  "What's your biggest controversial food opinion?",
  "If you could immediately become an expert at any skill, what would it be?",
  "What's your favorite song that you secretly play on repeat?",
  "What would you do if there was a zombie apocalypse tomorrow?",
  "What is the funniest thing that has happened to you this year?",
  "If you could have dinner with any historical figure, who would it be and why?",
  "What's one thing people assume about you that is completely wrong?",
  "Coffee, tea, or energy drinks — what fuels your days?",
  "What's a hobby you've always wanted to try but haven't yet?",
  "If animals could talk, which one do you think would be the rudest?",
  "What's the best advice anyone has ever given you?"
];

export function getRandomIcebreaker() {
  const index = Math.floor(Math.random() * ICEBREAKERS.length);
  return ICEBREAKERS[index];
}
