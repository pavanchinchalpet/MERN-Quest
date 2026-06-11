require('dotenv').config();

const parseTrustProxy = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalized = String(value).trim().toLowerCase();

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  const asNumber = Number(normalized);
  return Number.isNaN(asNumber) ? value : asNumber;
};

const getDefaultTrustProxy = () => {
  if (
    process.env.RENDER ||
    process.env.VERCEL ||
    process.env.RAILWAY_STATIC_URL ||
    process.env.HEROKU_APP_NAME
  ) {
    return 1;
  }

  return process.env.NODE_ENV === 'production' ? 1 : false;
};

const parseDurationMinutes = (value, fallbackMinutes) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackMinutes;
};

const ACCESS_TOKEN_MINUTES = parseDurationMinutes(process.env.ACCESS_TOKEN_MINUTES, 15);
const REFRESH_TOKEN_DAYS = parseDurationMinutes(process.env.REFRESH_TOKEN_DAYS, 7);

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'fallback_access_secret_change_in_production',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || 'fallback_refresh_secret_change_in_production',
  ACCESS_TOKEN_EXPIRES_IN: `${ACCESS_TOKEN_MINUTES}m`,
  REFRESH_TOKEN_EXPIRES_IN: `${REFRESH_TOKEN_DAYS}d`,
  ACCESS_TOKEN_MAX_AGE_MS: ACCESS_TOKEN_MINUTES * 60 * 1000,
  REFRESH_TOKEN_MAX_AGE_MS: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  FRONTEND_URL: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  GOOGLE_OAUTH_REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI || process.env.GOOGLE_CALLBACK_URL,
  EXECUTION_TIMEOUT_MS: process.env.EXECUTION_TIMEOUT_MS || 3000,
  TRUST_PROXY: parseTrustProxy(process.env.TRUST_PROXY) ?? getDefaultTrustProxy(),
};
