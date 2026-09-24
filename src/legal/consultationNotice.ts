import {
  DATA_CONTROLLER,
  KVKK_APPLICATION_SECTION,
  KVKK_CONTROLLER_SECTION,
  KVKK_RIGHTS_SECTION,
  type KvkkSection,
} from './kvkk';

/**
 * Privacy notice for the consultation request form (the one that ends in a
 * WhatsApp message). A lawyer should review it before launch.
 *
 * It says the form stores nothing on the site's servers, which is true today:
 * the form only builds a WhatsApp link. If bookings ever get saved by a
 * backend, this text must change first.
 */

export const CONSULTATION_NOTICE_TITLE = 'Görüşme Talebi Aydınlatma Metni';
export const CONSULTATION_NOTICE_VERSION = '2026-09-24';
export const CONSULTATION_NOTICE_UPDATED_LABEL = '24 Eylül 2026';

export const CONSULTATION_NOTICE_INTRO =
  '6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) madde 10 uyarınca, tanışma görüşmesi talep formunda paylaştığınız kişisel verilerin nasıl ve neden işlendiği hakkında sizi bilgilendirmek amacıyla hazırlanmıştır.';

export const CONSULTATION_NOTICE_SECTIONS: KvkkSection[] = [
  KVKK_CONTROLLER_SECTION,
  {
    title: 'İşlenen kişisel veriler',
    items: [
      'Ad soyad',
      'E-posta adresi',
      'Telefon numarası (isteğe bağlı)',
      'Görüşme için seçtiğiniz odak alanı',
      'İsteğe bağlı “not” alanına yazdığınız bilgiler',
      'WhatsApp yazışması sırasında paylaştığınız bilgiler',
    ],
    paragraphs: [
      'Not alanına ve yazışmalara sağlık durumunuz gibi özel nitelikli kişisel verilerinizi yazmamanızı rica ederiz.',
    ],
  },
  {
    title: 'Formun çalışma şekli',
    paragraphs: [
      'Bu form, verilerinizi web sitesinin sunucularına kaydetmez. “Talebi Gönder & WhatsApp’ta Görüş” düğmesine bastığınızda bilgileriniz hazır bir WhatsApp mesajına dönüştürülür. Mesajı gönderip göndermemek sizin kararınızdır; göndermediğiniz sürece bilgileriniz bize ulaşmaz.',
      'Mesajı gönderdiğinizde bilgiler WhatsApp üzerinden veri sorumlusunun hesabına iletilir.',
    ],
  },
  {
    title: 'İşleme amaçları',
    items: [
      'Görüşme talebinizi almak ve yanıtlamak',
      'Tanışma görüşmesinin gün ve saatini sizinle belirlemek',
      'Görüşmeyi yürütmek ve bu konuda sizinle iletişimi sürdürmek',
    ],
  },
  {
    title: 'Hukuki sebep',
    paragraphs: [
      `Verileriniz, talebiniz üzerine bir hizmet ilişkisinin kurulmasına yönelik adımların atılması için gerekli olduğundan (KVKK madde 5/2-c) ve talebinize yanıt verilebilmesi bakımından veri sorumlusunun meşru menfaati kapsamında (KVKK madde 5/2-f), elektronik ortamda ve sizin kendi iradenizle ilettiğiniz şekilde işlenir. Bu işleme için ayrıca onay kutusu işaretlemeniz gerekmez. WhatsApp kullanmak istemezseniz ${DATA_CONTROLLER.email} adresine e-posta ile de ulaşabilirsiniz.`,
    ],
  },
  {
    title: 'Verilerin aktarılması',
    paragraphs: [
      'Verileriniz satılmaz ve pazarlama amacıyla üçüncü kişilerle paylaşılmaz.',
      'Mesajınız, Meta tarafından işletilen WhatsApp hizmeti üzerinden iletilir. Bu hizmetin veri işleme koşulları WhatsApp’ın kendi gizlilik politikasına tabidir ve yurt dışında işlenme söz konusu olabilir; WhatsApp kullanmak tamamen isteğe bağlıdır. Yasal bir yükümlülük gerektirdiğinde yetkili kurum ve kuruluşlara bilgi verilebilir.',
    ],
  },
  {
    title: 'Saklama süresi',
    paragraphs: [
      'Yazışmanız, talebiniz sonuçlanana kadar ve ilgili mevzuatın öngördüğü süre boyunca saklanır. Görüşme gerçekleşmezse yazışma makul bir süre sonra silinir. Dilediğiniz zaman silinmesini isteyebilirsiniz.',
    ],
  },
  KVKK_RIGHTS_SECTION,
  KVKK_APPLICATION_SECTION,
];
