export type SignupUser = {
  phoneNumber: string;
  password: string;
  isTrainer: boolean;
}

export type SigninUser = {
  phoneNumber: string;
  password: string;
};

export interface ResetPasswordUser {
  phoneNumber: string;
  newPassword: string;
}