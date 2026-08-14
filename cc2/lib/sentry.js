gdfzdfga/**
 * Lightweight error reporting wrapper (Sentry-free).
 * Drop-in replacement for the original @sentry/nextjs wrapper.
 * All functions have the same API so callers don't need to change.
 */

export function captureException(error, context = {}) {
  console.error("[Error]", error, context);
}

export function captureMessage(message, level = "info", context = {}) {
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(`[${level.toUpperCase()}]`, message, context);
}

export function setUser(_user) {
  // no-op without Sentry
}

export function addBreadcrumb(message, _category, _data) {
  // no-op without Sentry
}

/**
 * Wrap API handler with error tracking
 */
export function withErrorTracking(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      captureException(error, {
        url: req.url,
        method: req.method,
      });
      if (!res.headersSent) {
        res.status(500).json({
          error: "Internal server error",
          message: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    }
  };
}

export function startTransaction(_name, _op) {
  return { finish: () => { } };
}

export function createSpan(transaction, _name, _op) {
  return { finish: () => { } };
}

export default {
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  withErrorTracking,
  startTransaction,
  createSpan,
};
