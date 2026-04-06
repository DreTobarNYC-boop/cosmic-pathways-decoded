// Template fallbacks — used ONLY when Gemini API fails
// These are element-personalized (not sign-specific) as noted in the spec

const ELEMENT_HOROSCOPES: Record<string, string[]> = {
  Fire: [
    "Your inner flame burns with renewed purpose today. Channel that bold energy into creative ventures — the universe rewards courage.",
    "A spark of inspiration ignites your path. Trust your instincts and move decisively. Your passion is your compass.",
    "The cosmos fuels your ambition. Today's fire burns away doubt — step forward with the confidence of someone who knows their destiny.",
  ],
  Earth: [
    "Ground yourself in the present moment. Practical steps taken today build the foundation for lasting abundance.",
    "The earth beneath you holds ancient wisdom. Trust the slow, steady growth unfolding in your life — roots run deep.",
    "Material and spiritual realms align today. Your natural stability becomes a magnet for the opportunities you've been cultivating.",
  ],
  Air: [
    "Your mind is a crystal prism today — ideas refract in brilliant new directions. Communicate freely; your words carry power.",
    "Intellectual currents carry you toward meaningful connections. Share your vision with those who resonate with your frequency.",
    "The winds of change whisper secrets to those who listen. Stay curious, stay open — breakthrough insights arrive unexpectedly.",
  ],
  Water: [
    "Emotional depths reveal hidden treasures today. Trust the currents of your intuition — they flow toward healing and renewal.",
    "Your sensitivity is not weakness but a sacred antenna. Today's undercurrents carry messages from your higher self.",
    "The cosmic tide pulls you toward profound understanding. Embrace the mystery — not everything needs to be solved, some things need to be felt.",
  ],
};

export function getFallbackHoroscope(element: string, date: Date = new Date()): string {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const templates = ELEMENT_HOROSCOPES[element] || ELEMENT_HOROSCOPES.Fire;
  return templates[dayOfYear % templates.length];
}
