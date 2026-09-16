/**
 * Serverless / Node.js API Handler for Consultation Booking Requests
 * Includes API Security Shielding: CORS, Rate Limiting, Input Sanitization, Honeypot Check.
 * (Manual Google Meet approval flow)
 */

// In-Memory Rate Limiter (IP-based)
const ipRequestCounts = new Map();

function isRateLimited(ip, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const record = ipRequestCounts.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count += 1;
  }

  ipRequestCounts.set(ip, record);
  return record.count > maxRequests;
}

// XSS Sanitizer Helper
function sanitizeString(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

export default async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer || '';
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

  // 1. CORS Validation
  if (process.env.NODE_ENV === 'production') {
    if (origin && !origin.startsWith(allowedOrigin)) {
      return res.status(403).json({ message: 'Forbidden: Access denied from unauthorized origin' });
    }
  }

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // 2. Rate Limiting Check
  if (isRateLimited(clientIp, req.method === 'POST' ? 5 : 30, 60000)) {
    return res.status(429).json({ message: 'Too many requests. Please try again in a minute.' });
  }

  // Handle POST /api/calendar/book
  if (req.method === 'POST') {
    const body = req.body || {};
    const { fullName, email, phone, topic, message, date, honeypot } = body;

    // 3. Honeypot Bot Check
    if (honeypot && String(honeypot).trim().length > 0) {
      return res.status(200).json({
        success: true,
        status: 'PENDING',
      });
    }

    // 4. Strict Input Validation & Sanitization
    const cleanName = sanitizeString(fullName);
    const cleanEmail = sanitizeString(email);
    const cleanPhone = sanitizeString(phone);
    const cleanTopic = sanitizeString(topic);
    const cleanMessage = sanitizeString(message);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanName || !emailRegex.test(cleanEmail) || !date) {
      return res.status(400).json({ message: 'Validation failed: Please fill out all required fields correctly.' });
    }

    return res.status(200).json({
      success: true,
      status: 'PENDING',
      message: 'Consultation request received for manual confirmation',
      bookingDetails: {
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        topic: cleanTopic,
        message: cleanMessage,
        date,
      },
    });
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}

