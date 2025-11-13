import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Set tracesSampleRate to 1.0 to capture 100% of transactions
  // In production, consider using a lower value or use tracesSampler
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Capture errors on server-side
  enabled: process.env.NODE_ENV === 'production',
  
  environment: process.env.NODE_ENV,
  
  // Ignore common errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'Network request failed',
    'Failed to fetch',
  ],
  
  // Adjust this value in production
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.level === 'warning') {
      return null;
    }
    return event;
  },
  
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
