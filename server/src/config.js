import 'dotenv/config';

const list = (v, d) => (v || d).split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean);
const clientUrls = list(process.env.CLIENT_URL, 'http://localhost:5173');

export const config = {
  port: Number(process.env.PORT) || 8080,
  clientUrls,
  publicClientUrl: clientUrls[0],
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n').replace(/^"|"$/g, ''),
  },
  resendKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || '',
  timezone: process.env.EVENT_TIMEZONE || 'UTC',
  cronSecret: process.env.CRON_SECRET || '',
};
