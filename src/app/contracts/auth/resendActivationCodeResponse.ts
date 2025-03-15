export interface ResendActivationCodeResponse {
    success: boolean;
    message?: string;
    remainingAttempts?: number;
  }