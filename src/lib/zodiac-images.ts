import ariesImg from "@/assets/zodiac/aries.png";
import taurusImg from "@/assets/zodiac/taurus.png";
import geminiImg from "@/assets/zodiac/gemini.png";
import cancerImg from "@/assets/zodiac/cancer.png";
import leoImg from "@/assets/zodiac/leo.png";
import virgoImg from "@/assets/zodiac/virgo.png";
import libraImg from "@/assets/zodiac/libra.png";
import scorpioImg from "@/assets/zodiac/scorpio.png";
import sagittariusImg from "@/assets/zodiac/sagittarius.png";
import capricornImg from "@/assets/zodiac/capricorn.png";
import aquariusImg from "@/assets/zodiac/aquarius.png";
import piscesImg from "@/assets/zodiac/pisces.png";

const ZODIAC_IMAGES: Record<string, string> = {
  Aries: ariesImg,
  Taurus: taurusImg,
  Gemini: geminiImg,
  Cancer: cancerImg,
  Leo: leoImg,
  Virgo: virgoImg,
  Libra: libraImg,
  Scorpio: scorpioImg,
  Sagittarius: sagittariusImg,
  Capricorn: capricornImg,
  Aquarius: aquariusImg,
  Pisces: piscesImg,
};

export function getZodiacImage(sign: string): string | undefined {
  return ZODIAC_IMAGES[sign];
}
