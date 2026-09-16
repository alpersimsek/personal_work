import { BookingFormData } from '../types';

export interface AvailableSlotResponse {
  date: string;
  slots: string[];
  isLive: boolean;
}

export interface BookingResponse {
  success: boolean;
  whatsAppUrl?: string;
  status?: 'PENDING' | 'APPROVED';
  message?: string;
}

/**
 * Default coach WhatsApp phone number (Turkey format without +)
 */
export const DEFAULT_COACH_WHATSAPP = '905325676839';

/**
 * Generates a pre-formatted WhatsApp chat link containing all consultation booking details.
 */
export function generateWhatsAppLink(
  formData: BookingFormData,
  coachPhone: string = DEFAULT_COACH_WHATSAPP
): string {
  const topicMap: Record<string, string> = {
    netlik: 'Zihinsel Netlik & Yön Bulma',
    donusum: 'Düşünceden Eyleme & Alışkanlıklar',
    diger: 'Bütünsel Yaşam & Denge',
  };

  const topicName = topicMap[formData.topic] || formData.topic;

  let text = `Merhaba Tuğba Hanım, web siteniz üzerinden Tanışma Seansı için randevu talebi oluşturdum.\n\n`;
  text += `*Talep Detayları:*\n`;
  text += `• *Ad Soyad:* ${formData.fullName}\n`;
  text += `• *E-posta:* ${formData.email}\n`;
  if (formData.phone && formData.phone.trim()) {
    text += `• *Telefon:* ${formData.phone.trim()}\n`;
  }
  text += `• *Odak Alanı:* ${topicName}\n`;
  if (formData.message && formData.message.trim().length > 0) {
    text += `• *Notum:* "${formData.message.trim()}"\n`;
  }
  text += `\nGörüşme gün ve saatimizi karşılıklı teyit etmek için sizinle sohbet başlatıyorum. Görüşmek dileğiyle!`;

  const cleanPhone = coachPhone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Returns available consultation slots for a given date.
 */
export async function fetchAvailableSlots(dateString: string): Promise<AvailableSlotResponse> {
  return {
    date: dateString,
    slots: ['10:00', '11:30', '14:00', '15:30', '17:00'],
    isLive: false,
  };
}

/**
 * Submits a manual consultation booking request.
 */
export async function submitManualBooking(
  formData: BookingFormData & { honeypot?: string }
): Promise<BookingResponse> {
  const whatsAppUrl = generateWhatsAppLink(formData);

  // Honeypot bot protection
  if (formData.honeypot && formData.honeypot.trim().length > 0) {
    return {
      success: true,
      status: 'PENDING',
      whatsAppUrl,
    };
  }

  return {
    success: true,
    status: 'PENDING',
    whatsAppUrl,
    message: 'Randevu talebiniz başarıyla alındı.',
  };
}


