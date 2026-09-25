/**
 * Frequently asked questions: the single source for the FAQ window and for the
 * copy that crawlers read in the raw HTML. Edit them here.
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQS: readonly FaqItem[] = [
  {
    question: 'Yaşam koçluğu ile terapi arasındaki temel fark nedir?',
    answer: 'Terapi genellikle geçmiş travmaların iyileştirilmesine ve psikolojik semptomların tedavisine odaklanır. Yaşam koçluğu ise şu anki bulunduğunuz noktayı dürüstçe değerlendirip geleceğe yönelik netlik, kararlılık ve eylem planı oluşturmayı hedefler. Koçluk tıbbi veya psikiyatrik bir tedavi değildir.',
  },
  {
    question: 'Görüşmeler nasıl ve nerede gerçekleşir?',
    answer: 'Görüşmeler çevrim içi (online) veya karşılıklı mutabakata göre yüz yüze yapılır. Her seans yaklaşık 50 dakika sürer ve tamamen güvenli, gizli bir alanda gerçekleşir.',
  },
  {
    question: 'Bir koçluk süreci genellikle ne kadar sürer?',
    answer: 'Kişinin ihtiyaçlarına ve hedeflerine bağlı olarak ortalama 6 ila 12 seanslık periyotlar önerilir. Süreç haftada bir veya iki haftada bir yapılan seanslarla ilerler.',
  },
  {
    question: 'İlk tanışma görüşmesinde ne konuşuyoruz?',
    answer: '30 dakikalık ücretsiz tanışma görüşmesinde nerede hissettiğinizi, koçluktan beklentilerinizi ve birlikte çalışmanın aramızdaki enerji ve yöntem açısından uygun olup olmadığını sakin bir şekilde konuşuruz.',
  },
  {
    question: 'Koçluk seanslarında bana ne yapmam gerektiği söylenecek mi?',
    answer: 'Hayır. Koçluk tavsiye ya da talimat vermek değildir. Güçlü ve derinlikli sorularla kendi sezgilerinizi, değerlerinizi ve size özgü en doğru yolları keşfetmenizi sağlar.',
  },
];
