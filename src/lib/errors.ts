// ─────────────────────────────────────────────────────────────
// CredVault – Typed Error Classes
// ─────────────────────────────────────────────────────────────

export class StellarError extends Error {
  code: string;
  statusCode?: number;

  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = 'StellarError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class InsufficientBalanceError extends StellarError {
  constructor(available?: string) {
    super(
      available
        ? `Insufficient balance. You have ${available} XLM available.`
        : 'Insufficient balance to complete this transaction.',
      'INSUFFICIENT_BALANCE'
    );
    this.name = 'InsufficientBalanceError';
  }
}

export class InvalidAddressError extends StellarError {
  constructor(address?: string) {
    super(
      address
        ? `"${address}" is not a valid Stellar address.`
        : 'Invalid Stellar address. Must start with G and be 56 characters.',
      'INVALID_ADDRESS'
    );
    this.name = 'InvalidAddressError';
  }
}

export class NoDestinationAccountError extends StellarError {
  constructor() {
    super(
      'This account doesn\'t exist on the network yet. Sending to a new account requires a minimum of 1 XLM + 0.01 XLM fee to activate it.',
      'NO_DESTINATION_ACCOUNT'
    );
    this.name = 'NoDestinationAccountError';
  }
}

export class WalletNotInstalledError extends StellarError {
  constructor() {
    super(
      'Freighter wallet extension not found. Please install it from freighter.app',
      'WALLET_NOT_INSTALLED'
    );
    this.name = 'WalletNotInstalledError';
  }
}

export class FreighterRejectedError extends StellarError {
  constructor() {
    super(
      'Transaction was cancelled. You rejected the signing request in Freighter.',
      'FREIGHTER_REJECTED'
    );
    this.name = 'FreighterRejectedError';
  }
}

export class HorizonTimeoutError extends StellarError {
  constructor() {
    super(
      'The Stellar network is responding slowly. Please try again in a moment.',
      'HORIZON_TIMEOUT',
      503
    );
    this.name = 'HorizonTimeoutError';
  }
}

export class RateLimitedError extends StellarError {
  constructor() {
    super(
      'Too many requests. Please wait 60 seconds before trying again.',
      'RATE_LIMITED',
      429
    );
    this.name = 'RateLimitedError';
  }
}

export class MemoTooLongError extends StellarError {
  constructor(length: number) {
    super(
      `Memo is ${length} characters, but the maximum is 28.`,
      'MEMO_TOO_LONG'
    );
    this.name = 'MemoTooLongError';
  }
}

export class WalletStateMismatchError extends StellarError {
  constructor() {
    super(
      'Transaction sequence mismatch. Please refresh and try again.',
      'WALLET_STATE_MISMATCH'
    );
    this.name = 'WalletStateMismatchError';
  }
}

export class NetworkError extends StellarError {
  constructor(detail?: string) {
    super(
      detail || 'Network error. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
    this.name = 'NetworkError';
  }
}

/**
 * Extract a user-friendly error message from any caught error.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof StellarError) {
    return error.message;
  }
  if (error instanceof Error) {
    // Handle Freighter rejection patterns
    if (error.message.includes('User declined')) {
      return 'Transaction was cancelled in Freighter.';
    }
    if (error.message.includes('access')) {
      return 'Wallet connection was declined.';
    }
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Extract error code from any caught error.
 */
export function getErrorCode(error: unknown): string {
  if (error instanceof StellarError) {
    return error.code;
  }
  return 'UNKNOWN';
}
