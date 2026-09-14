export interface NavItem {
  label: string;
  href: string;
}

export interface BookingFormData {
  fullName: string;
  email: string;
  phone?: string;
  topic: 'netlik' | 'donusum' | 'diger';
  message: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  sessionType: 'google-meet' | 'phone' | 'in-person';
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ReflectionQuestion {
  id: number;
  question: string;
  subtitle: string;
  options: {
    label: string;
    description: string;
    focus: 'netlik' | 'donusum' | 'denge';
  }[];
}

export interface ReflectionResult {
  title: string;
  insight: string;
  recommendedTopic: 'netlik' | 'donusum' | 'diger';
  promptQuestion: string;
}

export interface TestimonialItem {
  quote: string;
  author: string;
  role: string;
  theme: string;
  timeframe: string;
}
