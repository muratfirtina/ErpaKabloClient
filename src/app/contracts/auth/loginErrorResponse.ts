export interface LoginErrorResponse {
    message: string;
    failedAttempts: number;
    isLockedOut: boolean;
    lockoutSeconds?: number;
    errorType: number;
  }