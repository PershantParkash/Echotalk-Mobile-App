import * as Types from "./user.types";

const initialState: Types.UserReducerState = {
  user: {
    accountType: null,
    userType: null,
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    otp: "",
    firstName: "",
    lastName: "",
    email: "",
    image: "",
    location: {
      country: "",
      state: "",
      city: "",
      address1: "",
      address2: "",
      postalCode: "",
      timezone: "",
    },
    languages: [
      {
        name: "",
        proficiency: "",
      },
    ],
    education: [
      { institute: "", areaOfStudy: "", startDate: null, endDate: null },
    ],
    experience: [{ company: "", title: "", startDate: null, endDate: null }],
    certification: [
      { certificationName: "", institute: "", startDate: null, endDate: null },
    ],
  },
  currentStep: Types.RegisterSteps.AccountType,
  firebaseOtpVerificationId: "",

  userDetails: {
    accountType: Types.AccountType.Individual,
    userType: Types.UserType.Regular,
    currentRole: Types.CurrentRole.Regular,
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    otp: "",
    fullName: "",
    email: "",
    profileImage: "",
    educations: [],
    experiences: [],
    certifications: [],
    isTrainer: false,
  },
};

export const userReducer = (state = initialState, action: Types.ActionType) => {
  switch (action.type) {
    case Types.SET_USER_DETAILS:
      return {
        ...state,
        userDetails: action.payload,
      };

    case Types.RESET_USER_DETAILS:
      return {
        ...state,
        userDetails: {
          accountType: Types.AccountType.Individual,
          userType: Types.UserType.Regular,
          currentRole: Types.CurrentRole.Regular,
          phoneNumber: "",
          password: "",
          confirmPassword: "",
          otp: "",
          fullName: "",
          email: "",
          profileImage: "",
          education: [],
          experience: [],
          certification: [],
          isTrainer: false,
        },
      };

    case Types.SET_UPDATE_APP_USER:
      return {
        ...state,
        user: action.payload,
      };

    case Types.SET_UPDATE_APP_USER_EDUCATION:
      return {
        ...state,
        user: {
          ...state.user,
          education: action.payload,
        },
      };

    case Types.SET_UPDATE_APP_USER_EXPERIENCEE:
      return {
        ...state,
        user: {
          ...state.user,
          experience: action.payload,
        },
      };

    case Types.SET_UPDATE_APP_USER_CERTIFICATION:
      return {
        ...state,
        user: {
          ...state.user,
          certification: action.payload,
        },
      };

    case Types.SET_CURRENT_STEP:
      return {
        ...state,
        currentStep: action.payload,
      };

    case Types.SET_OTP_VERIFICATION_ID:
      return {
        ...state,
        firebaseOtpVerificationId: action.payload,
      };

    case Types.CLEAR_USER:
      return {
        ...state,
        user: initialState.user, 
      };

    default:
      return state;
  }
};
