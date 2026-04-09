"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";

interface InfoTooltipProps {
  term: string;
  children?: React.ReactNode;
}

// Explanations for esoteric/spiritual terms - written in plain, accessible language
const TERM_EXPLANATIONS: Record<string, { title: string; explanation: string }> = {
  // Grabovoi
  grabovoi: {
    title: "Grabovoi Codes",
    explanation: "Number sequences developed by Russian mathematician Grigori Grabovoi. Each code is believed to carry a specific vibration that can help manifest intentions — from healing to abundance to protection. You focus on the numbers while holding your intention clearly in mind."
  },
  
  // Frequencies
  schumann: {
    title: "Schumann Resonance",
    explanation: "The Earth's natural electromagnetic heartbeat, averaging 7.83 Hz. It's the frequency of the space between Earth's surface and the ionosphere. Many believe staying in tune with this frequency promotes well-being, grounding, and mental clarity. When the Schumann spikes, sensitive people often feel it."
  },
  solfeggio: {
    title: "Solfeggio Frequencies",
    explanation: "Ancient healing tones used in Gregorian chants. Each frequency targets different aspects: 396 Hz releases fear, 528 Hz repairs DNA and brings transformation, 639 Hz improves relationships, 741 Hz awakens intuition, 852 Hz returns you to spiritual order. Listening to these tones is believed to promote healing and balance."
  },
  binaural: {
    title: "Binaural Beats",
    explanation: "When you hear two slightly different frequencies in each ear, your brain creates a third tone — the difference between them. This can guide your brainwaves into states like deep relaxation (theta), meditation (alpha), or focus (beta). Use headphones for full effect."
  },
  frequency: {
    title: "Healing Frequencies",
    explanation: "Sound frequencies measured in Hertz (Hz) that are believed to affect our mental, emotional, and physical states. Different frequencies resonate with different aspects of our being — some calm the mind, others energize, others promote healing. The universe is vibration, and so are you."
  },
  
  // Numerology
  lifePath: {
    title: "Life Path Number",
    explanation: "Your core number in numerology, calculated from your birth date. It reveals your life's purpose, natural talents, and the lessons you're here to learn. Think of it as your soul's assignment for this lifetime. Numbers 1-9 each carry unique energy, with 11, 22, and 33 being master numbers."
  },
  expressionNumber: {
    title: "Expression Number",
    explanation: "Calculated from your full birth name, this number reveals your natural abilities, talents, and how you express yourself to the world. It's what you're equipped to do — your toolkit for this life."
  },
  soulUrge: {
    title: "Soul Urge Number",
    explanation: "Also called the Heart's Desire number, calculated from the vowels in your name. It reveals your innermost desires, what truly motivates you at your core, and what your soul craves. This is your why."
  },
  personalYear: {
    title: "Personal Year Number",
    explanation: "A 9-year cycle that shows the theme and energy of your current year. Year 1 is new beginnings, Year 9 is endings and completion. Knowing your personal year helps you flow with life's natural rhythm instead of fighting it."
  },
  masterNumber: {
    title: "Master Numbers",
    explanation: "11, 22, and 33 are considered master numbers in numerology. They carry higher spiritual vibration and greater potential — but also greater challenges. They're not reduced to single digits because they hold special significance."
  },
  
  // Astrology
  sunSign: {
    title: "Sun Sign",
    explanation: "Your core identity — determined by where the Sun was when you were born. It's your ego, your will, your basic character. When someone asks 'what's your sign?' this is what they mean. But it's just one piece of your cosmic puzzle."
  },
  moonSign: {
    title: "Moon Sign",
    explanation: "Your emotional inner world — how you feel, what you need for security, your instinctive reactions. The Moon changes signs every 2-3 days, so birth time matters. Your Moon sign often shows up more in private than in public."
  },
  risingSign: {
    title: "Rising Sign (Ascendant)",
    explanation: "The mask you wear, how others first perceive you, your automatic response to new situations. Determined by which sign was on the eastern horizon at your exact birth time and location. It's your front door to the world."
  },
  mercuryRetrograde: {
    title: "Mercury Retrograde",
    explanation: "When Mercury appears to move backward in the sky (it's an optical illusion). Communication, technology, and travel can get glitchy. But it's also perfect for re-viewing, re-vising, and re-connecting. Don't fear it — use it to slow down and review."
  },
  transit: {
    title: "Planetary Transits",
    explanation: "The current positions of planets as they move through the sky, and how they interact with your birth chart. Transits trigger events and internal shifts. They're the weather forecast for your personal cosmic climate."
  },
  houses: {
    title: "Astrological Houses",
    explanation: "Your birth chart is divided into 12 houses, each governing a life area: self, money, communication, home, creativity, health, relationships, transformation, philosophy, career, community, and spirituality. Planets in each house color how you experience that area."
  },
  
  // Chinese Astrology
  chineseZodiac: {
    title: "Chinese Zodiac",
    explanation: "A 12-year cycle where each year is ruled by an animal: Rat, Ox, Tiger, Rabbit, Dragon, Snake, Horse, Goat, Monkey, Rooster, Dog, Pig. Your birth year animal shapes your personality, compatibility, and fortune. Combined with the five elements, it creates a 60-year cycle."
  },
  chineseElement: {
    title: "Chinese Elements",
    explanation: "Five elements cycle through the Chinese zodiac: Wood, Fire, Earth, Metal, Water. Each adds flavor to your animal sign. Wood is growth and creativity, Fire is passion, Earth is stability, Metal is strength and precision, Water is wisdom and flow."
  },
  
  // Palm Reading
  lifeLine: {
    title: "Life Line",
    explanation: "The curved line around the base of your thumb. Despite popular belief, it doesn't predict how long you'll live. It shows your vitality, life energy, and major life changes. A deep line indicates strong life force; breaks can indicate significant transformations."
  },
  heartLine: {
    title: "Heart Line",
    explanation: "The horizontal line at the top of your palm, below the fingers. It reveals how you express emotions and approach relationships. A long, deep heart line suggests deep emotional capacity; a straighter line indicates a more rational approach to love."
  },
  headLine: {
    title: "Head Line",
    explanation: "The horizontal line in the middle of your palm. It shows how you think, learn, and make decisions. A long line indicates deep thinking; a curved line suggests creativity; a straight line indicates logical, practical thinking."
  },
  fateLine: {
    title: "Fate Line",
    explanation: "The vertical line running up the center of your palm (not everyone has one). It relates to life path and career. A strong fate line suggests a clear sense of direction; its absence doesn't mean no fate — it can mean you create your own path."
  },
  mounts: {
    title: "Palm Mounts",
    explanation: "The fleshy pads on your palm, each named after a planet. Mount of Venus (love/passion), Mount of Jupiter (ambition), Mount of Saturn (wisdom), Mount of Apollo (creativity), Mount of Mercury (communication), Mount of Luna (imagination). Developed mounts show strength in that area."
  },
  
  // General
  vibration: {
    title: "Vibration & Energy",
    explanation: "Everything in the universe vibrates at a frequency — including your thoughts, emotions, and physical body. Higher vibrations (love, joy, gratitude) attract positive experiences. Lower vibrations (fear, anger, shame) attract challenges. You can raise your vibration through intention, sound, and practice."
  },
  manifestation: {
    title: "Manifestation",
    explanation: "The practice of bringing your desires into reality through focused intention, belief, and aligned action. It's not magic — it's clarity. When you're clear about what you want and believe it's possible, you notice opportunities and take actions that move you toward it."
  },
  chakras: {
    title: "Chakras",
    explanation: "Seven main energy centers in your body, from the base of your spine to the top of your head. Each governs different aspects: survival (root), creativity (sacral), power (solar plexus), love (heart), expression (throat), intuition (third eye), connection (crown). Balanced chakras = balanced life."
  },
};

export function InfoTooltip({ term, children }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const info = TERM_EXPLANATIONS[term];
  
  if (!info) {
    console.warn(`[InfoTooltip] No explanation found for term: ${term}`);
    return children || null;
  }
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors ml-1"
        aria-label={`Learn about ${info.title}`}
      >
        <Info className="w-3 h-3" />
      </button>
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-card border border-primary/30 rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-display text-lg text-primary">{info.title}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {info.explanation}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// Convenience component that wraps text with an inline info button
export function WithInfo({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center">
      {children}
      <InfoTooltip term={term} />
    </span>
  );
}
