export enum AccountType { Individual = 'Individual', Organization = 'Organization' }
export enum UserType { Regular = 'Regular', Trainer = 'Trainer' }
export enum CurrentRole { Regular = 'Regular', Trainer = 'Trainer' }

export enum ProficiencyLevelEnum {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  FLUENT = 'fluent',
  NATIVE = 'native'
}

export type UserReducerState = {
 readonly user: AppUser;
 readonly userDetails: AppUserDetails;
 readonly currentStep: RegisterSteps;
 readonly firebaseOtpVerificationId: string;
}

export type UserEducation = {
  institute: string;
  areaOfStudy: string;
  startDate: Date | null;
  endDate: Date | null;
}
export type UserExperience = {
  company: string;
  title: string;
  startDate: Date | null;
  endDate: Date | null;
}
export type UserCertification = {
  institute: string;
  certificationName: string;
  startDate: Date | null;
  endDate: Date | null;
}

export type Location = {
    country: string,
    state: string,
    city: string,
    address1: string,
    address2: string,
    postalCode: string,
    timezone: string
}

export type languageType = {
 name: string,
 proficiency: string
}

export type languageError = {
  name?: string;
  proficiency?: string;
}


export type AppUser = {
  accountType: AccountType | null;
  userType: UserType | null;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  otp: string;
  firstName: string;
  lastName: string;
  email: string;
  image: string;
  location:  Location,
  languages: languageType[],
  education: UserEducation[];
  experience: UserExperience[];
  certification: UserCertification[];
}

export type AppUserDetails = {
  id?: number;
  accountType?: AccountType | undefined | null;
  userType?: UserType | undefined | null;
  currentRole?: CurrentRole;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  otp?: string;
  fullName?: string;
  email?: string;
  profileImage?: string;
  educations?: UserEducation[];
  experiences?: UserExperience[];
  certifications?: UserCertification[];
  isTrainer?: boolean;
};

export interface ActionType {
  type: string;
  payload?: any;
}

export enum RegisterSteps {
  AccountType = "AccountType",
  UserType = "UserType",
  PhonePassword = "PhonePassword",
  PhoneVerification = "PhoneVerification",
  PersonalDetails = "PersonalDetails",
  Education = "Education",
  Experience = "Experience",
  Certification = "Certification",
}

export type CertificationType = {
  certificationName: string;
  institute: string;
  startDate: Date | null;
  endDate: Date | null;
}

export type CertificationError = {
  certificationName?: string;
  institute?: string;
  startDate?: string ;
  endDate?: string
}

export type PersonalInfoError = Partial<{
    firstName: string;
    lastName: string;
    email: string;
    country:string;
    state: string;
    city: string;
    address1: string;
    address2: string;
    postalCode: string;
    timezone: string;
}>

export type EducationError = {
    institute?: string;
    areaOfStudy?: string;
    startDate?: string;
    endDate?: string;
}

export type ExperienceType = {
  company: string;
  title: string;
  startDate: Date | null;
  endDate: Date | null;
}


export type ExperienceError = {
  company?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
}

export const SET_UPDATE_APP_USER = "SET_UPDATE_APP_USER";
export const SET_UPDATE_APP_USER_EDUCATION = "SET_UPDATE_APP_USER_EDUCATION";
export const SET_UPDATE_APP_USER_EXPERIENCEE = "SET_UPDATE_APP_USER_EXPERIENCE";
export const SET_UPDATE_APP_USER_CERTIFICATION = "SET_UPDATE_APP_USER_CERTIFICATION";
export const SET_OTP_VERIFICATION_ID = "SET_OTP_VERIFICATION_ID";
export const SET_CURRENT_STEP = "SET_CURRENT_STEP";
export const SET_USER_DETAILS = "SET_USER_DETAILS";
export const CLEAR_USER = "CLEAR_USER";
export const RESET_USER_DETAILS = "RESET_USER_DETAILS";
