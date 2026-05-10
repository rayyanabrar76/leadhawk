export async function register() {
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_RUNTIME === 'nodejs') {
    console.log(
      [
        '',
        '\x1b[33m⚠️  MANUAL STEP REQUIRED (one-time):\x1b[0m',
        '   1. Supabase Dashboard → Authentication → Providers → Google → Enable',
        '   2. Paste GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (from .env.local)',
        '   3. Copy the Supabase callback URL shown there',
        '   4. Add it to Google Cloud Console → Credentials → OAuth Client → Authorized redirect URIs',
        '',
      ].join('\n')
    )
  }
}
