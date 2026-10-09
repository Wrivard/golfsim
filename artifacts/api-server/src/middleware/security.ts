import type { Request, Response, NextFunction } from "express";

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://apis.google.com https://www.googleapis.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '));
  }
  
  next();
}

const rateLimitStores = new Map<string, Map<string, { count: number; resetTime: number }>>();
let limiterIdCounter = 0;

export function rateLimit(options: { 
  windowMs: number; 
  maxRequests: number; 
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const { windowMs, maxRequests, message = 'Trop de requêtes, veuillez réessayer plus tard.' } = options;
  const keyGenerator = options.keyGenerator || ((req: Request) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  });
  
  const limiterId = `limiter_${limiterIdCounter++}`;
  rateLimitStores.set(limiterId, new Map());

  return (req: Request, res: Response, next: NextFunction) => {
    const store = rateLimitStores.get(limiterId)!;
    const key = keyGenerator(req);
    const now = Date.now();
    const record = store.get(key);

    if (!record || now > record.resetTime) {
      store.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({ ok: false, message });
    }

    record.count++;
    next();
  };
}

export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 1000);
}

export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') return '';
  
  const email = input.trim().toLowerCase().slice(0, 254);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? email : '';
}

export function sanitizePhone(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input.replace(/[^\d\s\-\(\)\+\.]/g, '').slice(0, 20);
}

export function sanitizeBookingInput(data: any): any {
  return {
    name: data.name ? sanitizeString(data.name) : '',
    email: data.email ? sanitizeEmail(data.email) : '',
    phone: data.phone ? sanitizePhone(data.phone) : undefined,
    date: data.date,
    time: data.time ? String(data.time).slice(0, 5) : '',
    duration: data.duration ? String(data.duration).slice(0, 5) : '',
    bayType: data.bayType,
    players: typeof data.players === 'number' ? Math.min(Math.max(1, data.players), 4) : 1,
    notes: data.notes ? sanitizeString(data.notes) : undefined,
  };
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  const status = err.status || err.statusCode || 500;
  
  const safeMessage = status >= 500 
    ? 'Une erreur est survenue. Veuillez réessayer.'
    : (err.message || 'Erreur de requête');

  res.status(status).json({ 
    ok: false, 
    message: safeMessage 
  });
}

export function validateContentType(req: Request, res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      if (req.path.startsWith('/api/') && !req.path.includes('/oauth') && !req.path.includes('/calendar/webhook')) {
        return res.status(415).json({ 
          ok: false, 
          message: 'Content-Type must be application/json' 
        });
      }
    }
  }
  return next();
}

setInterval(() => {
  const now = Date.now();
  rateLimitStores.forEach((store) => {
    store.forEach((record, key) => {
      if (now > record.resetTime) {
        store.delete(key);
      }
    });
  });
}, 60000);
