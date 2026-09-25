/**
 * The home page copy that crawlers get in the raw HTML.
 *
 * Each string is a copy of text on the live page. A test checks that every one
 * still appears in the source file named next to it, so a change to the page
 * that is not mirrored here fails loudly instead of leaving the copy stale.
 */

/** From src/components/ServicesSection.tsx */
export const SERVICES = [
  {
    title: 'Kendini ve Yönünü Keşfet',
    description:
      'Ne istediğini bilmediğin dönemlerde zihindeki karmaşayı sadeleştirir, değerlerini ve gerçekten önemli olanı görünür hâle getiririz.',
  },
  {
    title: 'Düşünceden Eyleme',
    description:
      'Seni aynı yerde tutan alışkanlıkları ve tekrar eden kalıpları fark eder, sana uygun gerçekçi adımlarla sürdürülebilir değişim oluştururuz.',
  },
  {
    title: 'Zihinsel Denge & Mindfulness',
    description:
      'Günlük hayatın yoğun telaşı içinde kendi merkezinde kalmayı, tükenmişliği önleyip sakin ve sürdürülebilir bir içsel denge kurmayı deneyimlersin.',
  },
] as const;

/** From src/components/CoachProfileSection.tsx */
export const COACH = {
  heading: 'Koçun Hikayesi & Yaklaşımı',
  storyTitle: 'Kurumsal Dünyadan İçsel Dönüşüme',
  story:
    'Finans ve yönetim alanındaki 10+ yıllık kurumsal deneyimimin ardından, sürdürülebilir başarının dışsal hedeflerden önce içsel dinginlikle başladığını fark ettim. Bugün, danışanlarıma zihinsel berraklık ve özgün yaşam ritimleri kurma yolunda eşlik ediyorum.',
  quote: 'Cevapları sana vermek için değil, senin zaten bildiklerini hatırlatmak için buradayım.',
} as const;

/** From src/components/HeroSection.tsx */
export const HERO_TEXT =
  'Hayatındaki gürültüyü biraz azaltıp ne istediğini gerçekten duymaya başladığında, değişim çok daha doğal bir yerden başlar.';
