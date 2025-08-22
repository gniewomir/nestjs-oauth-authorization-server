import {
  TUserCodesRecord,
  TUserErrorCode,
} from "@domain/auth/OAuth/User/Errors/UserException";

const map: TUserCodesRecord = {
  "invalid-email": "Provided email is invalid",
  "invalid-password": "Password have to be at least 12 characters",
  "password-too-short": "Password have to be at least 12 characters",
  "password-too-long": "Password is to long.",
  "password-too-weak":
    "At least half of the characters in password have to be unique",
  "user-exists": "User with this email already exist",
  "unknown-email": "User with this email does not exist",
  "unknown-password": "Password does not match our records",
};

export const isEmailErrorCode = (
  errorCode?: string,
): errorCode is TUserErrorCode => {
  if (typeof errorCode !== "string") {
    return false;
  }
  const emailErrors: TUserErrorCode[] = [
    "invalid-email",
    "user-exists",
    "unknown-email",
  ];
  return emailErrors.includes(errorCode as unknown as TUserErrorCode);
};

export const isPasswordErrorCode = (
  errorCode?: string,
): errorCode is TUserErrorCode => {
  const passwordErrors: TUserErrorCode[] = [
    "invalid-password",
    "password-too-short",
    "password-too-long",
    "password-too-weak",
    "unknown-password",
  ];
  return passwordErrors.includes(errorCode as unknown as TUserErrorCode);
};

export const isValidErrorCode = (
  errorCode?: string,
): errorCode is TUserErrorCode => {
  if (typeof errorCode !== "string") {
    return false;
  }
  return (
    isEmailErrorCode(errorCode as unknown as TUserErrorCode) ||
    isPasswordErrorCode(errorCode as unknown as TUserErrorCode)
  );
};

export const userErrorCodeToMessage = (errorCode: TUserErrorCode) => {
  return map[errorCode];
};
