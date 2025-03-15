export interface VerifyActivationCodeResponse {
    verified: boolean;
    message?: string;
    remainingAttempts?: number;
    exceeded?: boolean;
  }