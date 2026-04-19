/**
 * Normalize any error-like value into a human-readable string.
 * Safe to render directly as a React child — never returns an object.
 *
 * Accepts: Error instances, strings, axios errors, plain objects, null/undefined.
 */
export function toErrorMessage(err, fallback = 'An unexpected error occurred.') {
  if (err == null) return fallback;
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || fallback;

  // Axios-style error shapes
  if (typeof err === 'object') {
    if (typeof err.message === 'string') return err.message;
    if (typeof err.error === 'string') return err.error;
    if (err.response?.data?.error) {
      const e = err.response.data.error;
      if (typeof e === 'string') return e;
      if (typeof e?.message === 'string') return e.message;
    }
    if (typeof err.response?.data?.message === 'string') return err.response.data.message;
  }

  return fallback;
}
