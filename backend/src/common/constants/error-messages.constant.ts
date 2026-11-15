export const ERROR_MESSAGES = {
  EMPLOYEE: {
    NOT_FOUND: 'Employee not found',
    NOT_ACTIVATED: 'Employee account is not activated',
    DEACTIVATED: 'Employee account is deactivated',
  },
  AUTH: {
    INVALID_ACTIVATION_TOKEN: 'Invalid or expired activation token',
    ACCOUNT_ALREADY_ACTIVATED: 'Account already activated',
    INVALID_CREDENTIALS: 'Invalid Credentials',
    INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
    MISSING_REFRESH_TOKEN: 'Refresh token is missing',
  },
} as const;
