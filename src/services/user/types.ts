export type UpdateUser = {
  fullName?: string;
  email?: string;
  profileImage?: string;
  isTrainer?: boolean;
  phoneNumber?:string,
  educations?: {
    institute: string;
    areaOfStudy: string;
    startDate: Date | null;
    endDate: Date | null;
  }[];
  experiences?: {
    company: string;
    title: string;
    startDate: Date | null;
    endDate: Date | null;
  }[];
  certifications?: {
    institute: string;
    certificationName: string;
    startDate: Date | null;
    endDate: Date | null;
  }[];
  location?: {
    country: string;
    state: string;
    city: string;
    address1: string;
    address2: string;
    postalCode: string;
    timezone: string;
  };
  languages?: { name: string; proficiency: string }[]; 
};
