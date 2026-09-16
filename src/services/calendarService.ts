import { BookingFormData } from '../types';

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
 * Generates a pre-formatted WhatsApp chat link containing consultation booking details (Day only, no time slot).
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

  let text = `Merhaba Tuğba Hanım, web siteniz üzerinden 15 dakikalık Tanışma Seansı için randevu talebi oluşturdum.\n\n`;
  text += `*Randevu Detayları:*\n`;
  text += `• *Talep Edilen Gün:* ${formData.preferredDate}\n`;
  text += `• *Ad Soyad:* ${formData.fullName}\n`;
  text += `• *E-posta:* ${formData.email}\n`;
  if (formData.phone && formData.phone.trim()) {
    text += `• *Telefon:* ${formData.phone.trim()}\n`;
  }
  text += `• *Odak Alanı:* ${topicName}\n`;
  if (formData.message && formData.message.trim().length > 0) {
    text += `• *Notum:* "${formData.message.trim()}"\n`;
  }
  text += `\nRandevu saatimizi karşılıklı teyit etmek ve Google Meet davetiyemi kesinleştirmek için sizinle sohbet başlatıyorum. Görüşmek dileğiyle!`;

  const cleanPhone = coachPhone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Sends a consultation booking request (Option B: WhatsApp Chat-First Pre-approval Flow).
 * Creates a pending reservation request and returns a formatted WhatsApp URL.
 */
export async function createGoogleMeetBooking(formData: BookingFormData & { honeypot?: string }): Promise<BookingResponse> {
  const whatsAppUrl = generateWhatsAppLink(formData);

  // Client-side Honeypot Check: Silent bot rejection
  if (formData.honeypot && formData.honeypot.trim().length > 0) {
    return {
      success: true,
      status: 'PENDING',
      whatsAppUrl,
    };
  }

  try {
    const response = await fetch('/api/calendar/book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || '',
        topic: formData.topic,
        message: formData.message.trim(),
        date: formData.preferredDate,
        status: 'PENDING',
        honeypot: formData.honeypot || '',
      }),
    });

    if (response.ok) {
      return {
        success: true,
        status: 'PENDING',
        whatsAppUrl,
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Randevu talebi oluşturulurken bir hata oluştu');
    }
  } catch (error: any) {
    return {
      success: true,
      status: 'PENDING',
      whatsAppUrl,
    };
  }
}


