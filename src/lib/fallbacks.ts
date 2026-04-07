// Template fallbacks — used ONLY when AI API fails
// These are element-personalized (not sign-specific)

const ELEMENT_HOROSCOPES: Record<string, string[]> = {
  Fire: [
    "You've got extra energy today — use it. Pick one project that's been sitting there and knock out the first step. Action beats overthinking right now.",
    "Today's a good day to take a risk you've been putting off. Start that conversation, send that pitch, make that move. Your gut is on point today.",
    "You might feel restless — that's a signal to channel it into something productive. Set one clear goal for today and go after it hard.",
  ],
  Earth: [
    "Today is about steady progress. Pick one thing that needs organizing — finances, your schedule, your workspace — and get it sorted. Small wins add up fast.",
    "Trust your instincts on practical matters today. If something feels off about a deal or plan, look closer before committing. Your grounded nature is your best tool.",
    "Good day to build something lasting. Focus on the basics — health, finances, relationships. One solid step today is worth more than ten big plans tomorrow.",
  ],
  Air: [
    "Your mind is sharp today — use it for problem-solving. That issue you've been stuck on? Try a completely different angle. Fresh ideas are right there.",
    "Great day for conversations that matter. Reach out to someone you've been meaning to connect with. Your words carry weight today — use them well.",
    "You might feel pulled in different directions. That's fine — pick the two most important things and let the rest wait. Focus beats multitasking today.",
  ],
  Water: [
    "Trust your gut today — it's picking up on things your head might miss. If someone or something feels off, pay attention. Your intuition is your superpower right now.",
    "Good day to check in with yourself emotionally. Take 10 minutes to journal, meditate, or just sit with your thoughts. Clarity comes when you stop and listen.",
    "Your empathy is strong today — use it to connect with someone who needs it. But set boundaries too. Helping others works best when you're not running on empty.",
  ],
};

export function getFallbackHoroscope(element: string, date: Date = new Date()): string {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const templates = ELEMENT_HOROSCOPES[element] || ELEMENT_HOROSCOPES.Fire;
  return templates[dayOfYear % templates.length];
}
