const production = process.env.NODE_ENV === 'production';

function required(name: string, minimum = 1): string {
  const value = process.env[name]?.trim() || '';
  if (production && value.length < minimum) {
    throw new Error(`${name} must be set${minimum > 1 ? ` and contain at least ${minimum} characters` : ''}`);
  }
  return value;
}

function publicUrl(): string {
  const raw = production ? required('PUBLIC_BASE_URL') : (process.env.PUBLIC_BASE_URL || 'http://localhost:3000');
  let parsed: URL;
  try { parsed = new URL(raw); } catch { throw new Error('PUBLIC_BASE_URL must be a valid absolute URL'); }
  if (production && parsed.protocol !== 'https:') throw new Error('PUBLIC_BASE_URL must use HTTPS in production');
  if (parsed.pathname !== '/' || parsed.search || parsed.hash) throw new Error('PUBLIC_BASE_URL must contain only an origin');
  return parsed.origin;
}

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port');

export const config = {
  production,
  port,
  secretKey: production ? required('SECRET_KEY', 32) : (process.env.SECRET_KEY || 'development-only-secret-key-32-chars'),
  adminUsername: production ? required('ADMIN_USERNAME') : (process.env.ADMIN_USERNAME || 'admin'),
  adminPassword: process.env.ADMIN_PASSWORD || (production ? '' : 'admin'),
  publicBaseUrl: publicUrl(),
  allowedHosts: (production ? required('ALLOWED_HOSTS') : (process.env.ALLOWED_HOSTS || 'localhost,127.0.0.1'))
    .split(',').map(value => value.trim().toLowerCase()).filter(Boolean)
};
