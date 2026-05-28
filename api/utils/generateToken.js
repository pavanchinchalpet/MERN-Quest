const jwt = require('jsonwebtoken');
const env = require('../config/env');

const ACCESS_COOKIE_NAME = 'accessToken';
const REFRESH_COOKIE_NAME = 'refreshToken';

const createCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge,
});

const signAccessToken = (userId, role) =>
  jwt.sign({ userId, role, type: 'access' }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
  });

const signRefreshToken = (userId, role) =>
  jwt.sign({ userId, role, type: 'refresh' }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  });

const setAuthCookies = (res, userId, role) => {
  const accessToken = signAccessToken(userId, role);
  const refreshToken = signRefreshToken(userId, role);

  res.cookie(ACCESS_COOKIE_NAME, accessToken, createCookieOptions(env.ACCESS_TOKEN_MAX_AGE_MS));
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, createCookieOptions(env.REFRESH_TOKEN_MAX_AGE_MS));

  return { accessToken, refreshToken };
};

const clearAuthCookies = (res) => {
  const expiredOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    expires: new Date(0),
  };

  res.cookie(ACCESS_COOKIE_NAME, '', expiredOptions);
  res.cookie(REFRESH_COOKIE_NAME, '', expiredOptions);
};

module.exports = {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  clearAuthCookies,
};
