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

export type BlogCategory =
  | 'Farkındalık'
  | 'Dönüşüm'
  | 'Kariyer & Liderlik'
  | 'İlişkiler'
  | 'İçsel Netlik';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: BlogCategory | string;
  tags: string[];
  author: string;
  readTime: string;
  date: string;
  coverImage: string;
  published: boolean;
  featured: boolean;
  likes: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  content: string;
}

export interface BlogFilterOptions {
  category?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
}

export interface AdminSession {
  username: string;
  isLoggedIn: boolean;
  loginTime?: string;
}

