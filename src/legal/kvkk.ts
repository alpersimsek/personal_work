/**
 * Newsletter privacy notice (KVKK aydınlatma metni) and consent wording.
 *
 * Change the text only together with KVKK_VERSION, and keep the same value in
 * server/config/consent.ts: the version is stored with every sign-up as proof
 * of exactly which wording the person agreed to. A lawyer should review this
 * text before the newsletter goes live.
 */

/** Identifies this exact wording; stored with each subscriber's consent. */
export const KVKK_VERSION = '2026-09-24';
export const KVKK_UPDATED_LABEL = '24 Eylül 2026';
export const KVKK_PATH = '/kvkk';

/** Fill in `address` to have it shown in the notice; it is left out while empty. */
export const DATA_CONTROLLER = {
  name: 'Tuğba Ergüner Şimşek',
  email: 'tugba.erguner@gmail.com',
  address: '',
} as const;

/** The consent sentence shown beside the checkbox. Must match the last section below. */
export const CONSENT_STATEMENT =
  'Ad soyad ve e-posta adresimin, bülten ve tanıtım içeriklerinin (yazılar, program ve etkinlik duyuruları) e-posta ile gönderilmesi amacıyla işlenmesine ve tarafıma ticari elektronik ileti gönderilmesine açık rıza veriyorum. Bu onayı dilediğim zaman geri alabileceğimi biliyorum.';

export interface KvkkSection {
  title: string;
  paragraphs?: string[];
  items?: string[];
}

const controllerLine = DATA_CONTROLLER.address
  ? `${DATA_CONTROLLER.name}, ${DATA_CONTROLLER.address}`
  : DATA_CONTROLLER.name;

export const KVKK_INTRO =
  '6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) madde 10 uyarınca, bültene kaydolurken paylaştığınız kişisel verilerin nasıl ve neden işlendiği hakkında sizi bilgilendirmek amacıyla hazırlanmıştır.';

/** Who the data controller is; shared by every notice on the site. */
export const KVKK_CONTROLLER_SECTION: KvkkSection = {
  title: 'Veri sorumlusu',
  paragraphs: [
    `Kişisel verileriniz, veri sorumlusu sıfatıyla ${controllerLine} tarafından işlenir. Bize ${DATA_CONTROLLER.email} adresinden ulaşabilirsiniz.`,
  ],
};

/** The data subject rights of KVKK article 11; shared by every notice on the site. */
export const KVKK_RIGHTS_SECTION: KvkkSection = {
  title: 'KVKK madde 11 kapsamındaki haklarınız',
  paragraphs: ['Veri sorumlusuna başvurarak aşağıdaki haklarınızı kullanabilirsiniz:'],
  items: [
    'Kişisel verilerinizin işlenip işlenmediğini öğrenme',
    'İşlenmişse buna ilişkin bilgi talep etme',
    'İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme',
    'Yurt içinde veya yurt dışında verilerin aktarıldığı üçüncü kişileri bilme',
    'Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme',
    'KVKK madde 7 çerçevesinde verilerin silinmesini veya yok edilmesini isteme',
    'Düzeltme, silme ve yok etme işlemlerinin verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme',
    'İşlenen verilerin münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhinize bir sonuç ortaya çıkmasına itiraz etme',
    'Kanuna aykırı işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme',
  ],
};

/** How to apply and complain; shared by every notice on the site. */
export const KVKK_APPLICATION_SECTION: KvkkSection = {
  title: 'Başvuru ve şikâyet',
  paragraphs: [
    `Taleplerinizi ${DATA_CONTROLLER.email} adresine yazılı olarak iletebilirsiniz. Başvurunuz, niteliğine göre en geç otuz gün içinde ve kural olarak ücretsiz sonuçlandırılır. Yanıtı yetersiz bulmanız veya süresinde yanıt alamamanız hâlinde Kişisel Verileri Koruma Kurulu’na şikâyette bulunma hakkınız saklıdır.`,
  ],
};

export const KVKK_SECTIONS: KvkkSection[] = [
  KVKK_CONTROLLER_SECTION,
  {
    title: 'İşlenen kişisel veriler',
    items: [
      'Ad soyad',
      'E-posta adresi',
      'Onayınızın ispatı için onay tarihi ve saati ile onayı verdiğiniz metnin sürümü',
    ],
  },
  {
    title: 'İşleme amaçları',
    items: [
      'Size bülten göndermek; blog yazıları, farkındalık ve içsel netlik içerikleri ile program ve etkinlik duyurularını e-posta yoluyla iletmek',
      'Onayınızı, onayı geri alma veya ret taleplerinizi kayıt altında tutmak',
    ],
  },
  {
    title: 'Toplama yöntemi ve hukuki sebep',
    paragraphs: [
      'Verileriniz, web sitesindeki bülten formu aracılığıyla elektronik ortamda toplanır.',
      'Bültenin gönderilmesi için verilerinizin işlenmesi açık rızanıza dayanır (KVKK madde 5/1). Bu rıza aynı zamanda, 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun kapsamında ticari elektronik ileti gönderilebilmesi için gereken onaydır.',
      'Onay kaydının saklanması ise bir hakkın tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması ile veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi hukuki sebeplerine dayanır (KVKK madde 5/2-ç ve 5/2-e).',
    ],
  },
  {
    title: 'Verilerin aktarılması',
    paragraphs: [
      'Verileriniz satılmaz ve pazarlama amacıyla üçüncü kişilerle paylaşılmaz.',
      'Yalnızca web sitesinin barındırılmasını ve bültenin gönderilmesini sağlayan hizmet sağlayıcılara, bu hizmetlerin sunulması için gerekli olduğu ölçüde aktarılabilir. Hizmet sağlayıcının yurt dışında bulunması hâlinde aktarım KVKK madde 9 hükümlerine uygun olarak yapılır. Yasal bir yükümlülük gerektirdiğinde yetkili kurum ve kuruluşlara bilgi verilebilir.',
    ],
  },
  {
    title: 'Saklama süresi',
    paragraphs: [
      'Verileriniz, onayınızı geri alana veya bültenden ayrılana kadar saklanır. Ayrıldıktan sonra, onayın ve geri alma talebinin ispatı için gereken kayıtlar (ad, e-posta adresi, onay ve geri alma tarihleri) ilgili mevzuatın öngördüğü süre boyunca saklanır; süre sonunda silinir veya anonim hâle getirilir.',
    ],
  },
  KVKK_RIGHTS_SECTION,
  KVKK_APPLICATION_SECTION,
  {
    title: 'Onayı geri alma',
    paragraphs: [
      'Onayınızı dilediğiniz zaman, gerekçe göstermeden ve ücretsiz olarak geri alabilirsiniz: web sitesindeki “Bültenden çık” düğmesiyle e-posta adresinizi yazarak çıkabilir, gönderilen e-postalardaki çıkış bağlantısını kullanabilir veya bize e-posta yazabilirsiniz. Onayı geri almanız, bülten dışındaki hiçbir hizmetten yararlanmanızı etkilemez; bültene katılmak tamamen isteğe bağlıdır.',
    ],
  },
  {
    title: 'Açık rıza beyanı',
    paragraphs: [
      'Bülten formundaki onay kutusunu işaretleyerek aşağıdaki beyanı vermiş olursunuz:',
      `“${CONSENT_STATEMENT}”`,
    ],
  },
];
