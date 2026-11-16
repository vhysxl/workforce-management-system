export const ERROR_MESSAGES = {
  EMPLOYEE: {
    NOT_FOUND: 'Employee not found',
    NOT_ACTIVATED: 'Employee account is not activated',
    DEACTIVATED: 'Employee account is deactivated',
    ALREADY_EXISTS: 'Employee with this email or NIK already exists',
  },
  AUTH: {
    INSUFFICIENT_ROLE: 'You do not have permission to access this resource',
    MISSING_ACCESS_TOKEN: 'Access token is missing',
    INVALID_ACCESS_TOKEN: 'Invalid or expired access token',
    INVALID_ACTIVATION_TOKEN: 'Invalid or expired activation token',
    INVALID_RESET_PASSWORD_TOKEN: 'Invalid or expired reset password token',
    ACCOUNT_ALREADY_ACTIVATED: 'Account already activated',
    INVALID_CREDENTIALS: 'Invalid Credentials',
    INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
    MISSING_REFRESH_TOKEN: 'Refresh token is missing',
    CREDENTIAL_ALREADY_EXISTS:
      'Credential already exists for this email or employee',
  },
} as const;
