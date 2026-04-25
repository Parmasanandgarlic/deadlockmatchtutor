const logger = require('./logger');

/**
 * Circuit Breaker — Protects against cascading failures from external APIs.
 *
 * States:
 *   CLOSED    → Requests pass through normally. Failures are counted.
 *   OPEN      → Requests are immediately rejected. Timer runs until reset.
 *   HALF_OPEN → A single trial request is allowed through. Success → CLOSED, failure → OPEN.
 *
 * Usage:
 *   const breaker = new CircuitBreaker('deadlock-api', { failureThreshold: 3, resetTimeoutMs: 30000 });
 *   const data = await breaker.call(() => axios.get(url));
 */

const STATES = { CLOSED: 'CLOSED', OPEN: 'OPEN', HALF_OPEN: 'HALF_OPEN' };

class CircuitBreaker {
  /**
   * @param {string} name                Human-readable name for logging
   * @param {Object} opts
   * @param {number} opts.failureThreshold  Consecutive failures before opening (default: 3)
   * @param {number} opts.resetTimeoutMs    Ms to wait in OPEN before trying HALF_OPEN (default: 30000)
   * @param {number} opts.halfOpenTrials    Successes needed in HALF_OPEN to close (default: 1)
   */
  constructor(name, opts = {}) {
    this.name = name;
    this.failureThreshold = opts.failureThreshold ?? 3;
    this.resetTimeoutMs = opts.resetTimeoutMs ?? 30000;
    this.halfOpenTrials = opts.halfOpenTrials ?? 1;

    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
  }

  /**
   * Execute `fn` through the circuit breaker.
   * @template T
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async call(fn) {
    if (this.state === STATES.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        const err = new Error(`Circuit breaker [${this.name}] is OPEN — request rejected`);
        err.code = 'CIRCUIT_OPEN';
        throw err;
      }
      // Transition to HALF_OPEN for a trial
      this._transitionTo(STATES.HALF_OPEN);
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure(err);
      throw err;
    }
  }

  /** @private */
  _onSuccess() {
    if (this.state === STATES.HALF_OPEN) {
      this.successCount += 1;
      if (this.successCount >= this.halfOpenTrials) {
        this._transitionTo(STATES.CLOSED);
      }
    } else {
      // Reset failure count on any success in CLOSED state
      this.failureCount = 0;
    }
  }

  /** @private */
  _onFailure(err) {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();

    if (this.state === STATES.HALF_OPEN) {
      // Trial failed — re-open
      this._transitionTo(STATES.OPEN);
    } else if (this.failureCount >= this.failureThreshold) {
      this._transitionTo(STATES.OPEN);
    }
  }

  /** @private */
  _transitionTo(newState) {
    if (this.state === newState) return;
    const oldState = this.state;
    this.state = newState;

    if (newState === STATES.OPEN) {
      this.nextAttemptTime = Date.now() + this.resetTimeoutMs;
      this.successCount = 0;
      logger.warn(
        `[CircuitBreaker] ${this.name}: ${oldState} → OPEN (failures: ${this.failureCount}, ` +
        `retry in ${this.resetTimeoutMs}ms)`
      );
    } else if (newState === STATES.HALF_OPEN) {
      this.successCount = 0;
      logger.info(`[CircuitBreaker] ${this.name}: ${oldState} → HALF_OPEN (trial request)`);
    } else if (newState === STATES.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
      logger.info(`[CircuitBreaker] ${this.name}: ${oldState} → CLOSED (recovered)`);
    }
  }

  /** Current state info for health checks */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      nextRetry: this.state === STATES.OPEN ? new Date(this.nextAttemptTime).toISOString() : null,
    };
  }
}

module.exports = { CircuitBreaker, STATES };
