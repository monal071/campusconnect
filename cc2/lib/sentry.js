import * as Sentry from "@sentry/nextjs";

/**
 * Sentry error reporting utilities
 */

/**
 * Capture exception with context
 */
export function captureException(error, context = {}) {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(error, {
      contexts: { custom: context },
    });
  } else {
    console.error("Error:", error, "Context:", context);
  }
}

/**
 * Capture message
 */
export function captureMessage(message, level = "info", context = {}) {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureMessage(message, {
      level,
      contexts: { custom: context },
    });
  } else {
    console.log(`[${level.toUpperCase()}]`, message, context);
  }
}

/**
 * Set user context
 */
export function setUser(user) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(message, category = "custom", data = {}) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
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
        body: req.body,
      });

      res.status(500).json({
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
}

/**
 * Start transaction for performance monitoring
 */
export function startTransaction(name, op = "http.server") {
  return Sentry.startTransaction({ name, op });
}

/**
 * Create span for specific operation
 */
export function createSpan(transaction, name, op) {
  return transaction.startChild({ op, description: name });
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
