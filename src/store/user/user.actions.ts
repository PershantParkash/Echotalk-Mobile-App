import * as Types from "./user.types";

export const setUpdateAppUser = (payload: Types.AppUser) => ({
  type: Types.SET_UPDATE_APP_USER,
  payload: payload,
});

export const setUpdateAppUserEducation = (payload: Types.UserEducation[]) => ({
  type: Types.SET_UPDATE_APP_USER_EDUCATION,
  payload: payload,
});

export const setUpdateAppUserExperience = (payload: Types.UserExperience[]) => ({
  type: Types.SET_UPDATE_APP_USER_EXPERIENCEE,
  payload: payload,
});

export const setUpdateAppUserCertification = (payload: Types.UserCertification[]) => ({
  type: Types.SET_UPDATE_APP_USER_CERTIFICATION,
  payload: payload,
});

export const setOtpVerificationId = (payload: string) => ({
  type: Types.SET_OTP_VERIFICATION_ID,
  payload: payload,
});

export const setCurrentStep = (payload: Types.RegisterSteps) => ({
  type: Types.SET_CURRENT_STEP,
  payload: payload,
});

export const setUserDetails = (payload: Types.AppUserDetails) => ({
  type: Types.SET_USER_DETAILS,
  payload: payload,
});

export const clearUser = () => ({
  type: Types.CLEAR_USER
});


export const resetUserDetails = () => ({
  type: Types.RESET_USER_DETAILS,
});
