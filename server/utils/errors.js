class AppError extends Error {
  constructor(message, { status = 500, code = 'APP_ERROR', cause, details } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.statusCode = status;
    this.code = code;
    this.details = details;
    if (cause) this.cause = cause;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class DependencyUnavailableError extends AppError {
  constructor(message, options = {}) {
    super(message, {
      status: options.status || 503,
      code: options.code || 'DEPENDENCY_UNAVAILABLE',
      cause: options.cause,
      details: options.details,
    });
  }
}

class UpstreamApiError extends AppError {
  constructor(message, { upstream = 'Deadlock API', endpoint, upstreamStatus, cause } = {}) {
    const retryable = upstreamStatus == null || upstreamStatus >= 500;
    super(message, {
      status: retryable ? 502 : 400,
      code: retryable ? 'UPSTREAM_API_ERROR' : 'UPSTREAM_BAD_REQUEST',
      cause,
      details: { upstream, endpoint, upstreamStatus },
    });
    this.upstream = upstream;
    this.endpoint = endpoint;
    this.upstreamStatus = upstreamStatus;
    this.retryable = retryable;
  }
}

module.exports = {
  AppError,
  DependencyUnavailableError,
  UpstreamApiError,
};
