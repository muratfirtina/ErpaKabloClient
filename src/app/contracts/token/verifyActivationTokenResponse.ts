export interface VerifyActivationTokenResponse {
    success: boolean;
    userId?: string;
    email?: string;
    message?: string;
    alreadyActivated?: boolean;
    remainingAttempts?: number;
  }