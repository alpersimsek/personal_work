import { PROGRAMS } from '../content/programs.js';

/**
 * The home page copy that crawlers get in the raw HTML.
 *
 * The coaching areas and the FAQ come from the shared content modules that the
 * page itself reads, so they cannot drift. The coach's story and the hero line
 * are copies of text in a component; a test checks each still appears in the
 * source file named next to it.
 */

/** The coaching areas: the home cards and the program pages read the same list. */
export const SERVICES = PROGRAMS.map(({ slug, title, description }) => ({ slug, title, description }));

/** From src/components/CoachProfileSection.tsx */
export const COACH = {
  heading: 'Koçun Hikayesi & Yaklaşımı',
  storyTitle: 'Kurumsal Dünyadan İçsel Dönüşüme',
  story:
    'Finans ve yönetim alanındaki 10+ yıllık kurumsal deneyimimin ardından, sürdürülebilir başarının dışsal hedeflerden önce içsel dinginlikle başladığını fark ettim. Bugün, danışanlarıma zihinsel berraklık ve özgün yaşam ritimleri kurma yolunda eşlik ediyorum.',
  quote: 'Cevapları sana vermek için değil, senin zaten bildiklerini hatırlatmak için buradayım.',
  highlights: [
    { title: '10+ Yıl Kurumsal Deneyim', text: 'Üst düzey yöneticilik, stratejik liderlik ve takım danışmanlığı birikimi.' },
    { title: 'ICF PCC & Mindfulness', text: 'Uluslararası koçluk akreditasyonu, MBSR eğitmenliği ve 1000+ saat seans.' },
    { title: 'Bütüncül Yaşam Metodu', text: 'Farkındalık, zihinsel netlik ve eyleme dayalı sürdürülebilir gelişim.' },
  ],
  approach:
    'Her seansı; yargılanma korkusunun olmadığı, kendi doğrularını masaya yatırabileceğin ve düşüncelerden kalıcı eylemlere adım atabileceğin güvenli bir duraklama alanı olarak tasarlıyorum.',
  principles: [
    { title: '%100 Gizlilik & Etik Standartlar', text: 'Tüm seanslar ICF etik tüzüğü kapsamında tam gizlilik ve güven altındadır.' },
    { title: 'Yargısız & Eşlikçi Alan', text: 'Tavsiye vermek yerine kendi sezgilerini güçlendiren derinlikli içgörü alanı.' },
  ],
} as const;

/** From src/components/HeroSection.tsx */
export const HERO_TEXT =
  'Hayatındaki gürültüyü biraz azaltıp ne istediğini gerçekten duymaya başladığında, değişim çok daha doğal bir yerden başlar.';
