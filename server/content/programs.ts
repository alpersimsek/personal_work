/**
 * The coaching areas and the way of working: the single source for the home
 * page cards, the program pages, the process section and the copy crawlers read.
 *
 * The "who it is for" and "what we do" lists are drafts written from the
 * site's existing tone and claim nothing beyond it; the coach should read and
 * adjust them.
 */

export interface Program {
  /** Matches the booking form's topic. */
  topic: 'netlik' | 'donusum' | 'diger';
  /** Address segment: /programlar/<slug>. */
  slug: string;
  tag: string;
  title: string;
  /** The short text on the home page card and in search results. */
  description: string;
  forWhom: readonly string[];
  whatWeDo: readonly string[];
}

export const PROGRAMS: readonly Program[] = [
  {
    topic: 'netlik',
    slug: 'kendini-ve-yonunu-kesfet',
    tag: 'NETLİK',
    title: 'Kendini ve Yönünü Keşfet',
    description:
      'Ne istediğini bilmediğin dönemlerde zihindeki karmaşayı sadeleştirir, değerlerini ve gerçekten önemli olanı görünür hâle getiririz.',
    forWhom: [
      'Ne istediğinden emin olmadığın, seçenekler arasında kaldığın bir dönemdeysen',
      'Zihnin kalabalık olduğunda ve kararlar gözünde büyüdüğünde',
      'Hayatının yönünü yeniden gözden geçirmek istediğinde',
    ],
    whatWeDo: [
      'Zihindeki karmaşayı konuşarak ve yazarak sadeleştiririz',
      'Değerlerini ve senin için gerçekten önemli olanı görünür kılarız',
      'Seçeneklerini, beklentilerini ve önceliklerini birlikte netleştiririz',
      'Sonunda atabileceğin küçük ve gerçekçi bir sonraki adımı belirleriz',
    ],
  },
  {
    topic: 'donusum',
    slug: 'dusunceden-eyleme',
    tag: 'DÖNÜŞÜM',
    title: 'Düşünceden Eyleme',
    description:
      'Seni aynı yerde tutan alışkanlıkları ve tekrar eden kalıpları fark eder, sana uygun gerçekçi adımlarla sürdürülebilir değişim oluştururuz.',
    forWhom: [
      'Ne yapman gerektiğini bildiğin hâlde başlayamadığında',
      'Aynı kalıplara tekrar tekrar döndüğünü fark ettiğinde',
      'Başladığın değişimi sürdürmekte zorlandığında',
    ],
    whatWeDo: [
      'Seni aynı yerde tutan alışkanlıkları ve düşünce kalıplarını fark ederiz',
      'Sana uygun, gerçekçi ve küçük adımlar tasarlarız',
      'Adımların nasıl gittiğini birlikte gözden geçirir, gerekirse yönü ayarlarız',
      'Motivasyona değil, sürdürülebilir bir ritme yaslanırız',
    ],
  },
  {
    topic: 'diger',
    slug: 'zihinsel-denge-mindfulness',
    tag: 'DENGE',
    title: 'Zihinsel Denge & Mindfulness',
    description:
      'Günlük hayatın yoğun telaşı içinde kendi merkezinde kalmayı, tükenmişliği önleyip sakin ve sürdürülebilir bir içsel denge kurmayı deneyimlersin.',
    forWhom: [
      'Yoğun bir tempoda kendi merkezinden uzaklaştığını hissettiğinde',
      'Yorgunluk ve tükenmişlik hissi biriktiğinde',
      'Daha sakin bir günlük ritim kurmak istediğinde',
    ],
    whatWeDo: [
      'Günün içine sığan kısa duraklamalar ve farkındalık pratikleri deneriz',
      'Seni yoran ve seni besleyen şeyleri birlikte ayırt ederiz',
      'Sana uygun bir günlük ritim ve sınırlar oluştururuz',
      'Pratikleri gündelik hayatına sığacak kadar küçük tutarız',
    ],
  },
];

export const findProgram = (slug: string): Program | undefined => PROGRAMS.find((program) => program.slug === slug);

export const PROGRAMS_HEADING = 'Birlikte neyin üzerinde çalışabiliriz?';

export const PROCESS_STEPS = [
  {
    number: '01',
    title: 'Tanışma',
    description:
      'Kısa bir ön görüşmeyle bulunduğun noktayı, beklentilerini ve birlikte çalışmanın sana uygun olup olmadığını konuşuruz.',
  },
  {
    number: '02',
    title: 'Netleşme',
    description:
      'Hedeflerinin altında gerçekten ne olduğunu keşfeder, önündeki engelleri ve tekrar eden düşünce kalıplarını birlikte görünür hâle getiririz.',
  },
  {
    number: '03',
    title: 'Harekete Geçme',
    description: 'İçgörüyü günlük hayatına taşıyabileceğin somut adımlara dönüştürür, ilerlemeyi birlikte takip ederiz.',
  },
] as const;

/** Shown on every program page; the same wording as the site footer. */
export const COACHING_DISCLAIMER =
  'Yaşam koçluğu; psikoterapi, psikolojik danışmanlık veya tıbbi tedavinin yerine geçmez.';
