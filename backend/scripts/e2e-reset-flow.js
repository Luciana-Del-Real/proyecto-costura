#!/usr/bin/env node
require('dotenv').config({ path: './.env' });
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const https = require('https');

const prisma = new PrismaClient();

function httpPostJson(url, data) {
  return new Promise((resolve, reject) => {
    try {
      const body = JSON.stringify(data);
      const parsed = new URL(url);
      const lib = parsed.protocol === 'https:' ? https : http;
      const opts = {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = lib.request(opts, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const contentType = res.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            try {
              return resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch (e) {
              return resolve({ status: res.statusCode, body: data });
            }
          }
          return resolve({ status: res.statusCode, body: data });
        });
      });

      req.on('error', (err) => reject(err));
      req.write(body);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

(async () => {
  try {
    const testEmail = process.env.E2E_TEST_EMAIL || 'e2e-test@example.com';
    const initialPassword = 'InitialP@ss1';
    console.log('Using test email:', testEmail);

    let user = await prisma.user.findUnique({ where: { email: testEmail } });
    if (!user) {
      const hashed = await bcrypt.hash(initialPassword, 12);
      user = await prisma.user.create({
        data: { name: 'E2E Test', email: testEmail, password: hashed, role: 'ALUMNO' },
      });
      console.log('Created user:', user.id);
    } else {
      console.log('Found user:', user.id);
    }

    // generate token and insert hashed record
    const token = crypto.randomBytes(32).toString('hex');
    const resetSecret = process.env.PASSWORD_RESET_SECRET || process.env.JWT_SECRET || 'fallback-secret-key';
    const tokenHash = crypto.createHmac('sha256', resetSecret).update(token).digest('hex');
    const minutes = Number(process.env.PASSWORD_RESET_EXPIRATION_MINUTES) || 15;
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

    const created = await prisma.passwordResetToken.create({
      data: { tokenHash, userId: user.id, expiresAt },
    });

    console.log('Inserted password reset token id:', created.id);
    console.log('Plain token (use this to call reset endpoint):', token);

    // call reset endpoint
    const apiBase = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}${process.env.API_PREFIX || '/api'}`;
    const resetUrl = `${apiBase.replace(/\/$/, '')}/auth/reset-password`;
    const newPassword = 'NewP@ss123!';
    console.log('Calling reset endpoint:', resetUrl);

    const resetResp = await httpPostJson(resetUrl, { token, password: newPassword });
    console.log('Reset response:', resetResp.status, resetResp.body);

    // try to login with new password
    const loginUrl = `${apiBase.replace(/\/$/, '')}/auth/login`;
    const loginResp = await httpPostJson(loginUrl, { email: testEmail, password: newPassword });
    console.log('Login response:', loginResp.status, loginResp.body);

    // show tokens for user
    const tokens = await prisma.passwordResetToken.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    console.log('Password reset tokens for user:');
    tokens.forEach((t) => console.log({ id: t.id, used: t.used, expiresAt: t.expiresAt }));

    console.log('E2E reset flow completed.');
  } catch (err) {
    console.error('E2E error:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
