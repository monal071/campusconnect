import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  enabled: process.env.NODE_ENV === 'production',
  
  environment: process.env.NODE_ENV,
  
  // Server-specific configuration
  beforeSend(event, hint) {
    // Add server context
    if (event.request) {
      event.request.cookies = undefined; // Remove sensitive data
    }
    return event;
  },
  
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});
