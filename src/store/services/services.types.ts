export type ServicesReducerState = {
  readonly newService: CreateService;
  readonly fetchedTrainerServices: FetchedTrainerServices[];
  readonly fetchedAllServices: FetchedBrowseService[];
};

export type CreateService = {
  id?: number | null;
  title: string;
  description: string;
  price: number;
  uploadedMediaUrls: string[];
};

export type Service = {
  id: number;
  name?: string;
  title?: string;
  description: string;
  price: string | number;
  originalPrice?: number;
  bookings?: number;
  rating?: number;
  image?: string;
  thumbnail?: string;
  attachments?: string[];
}

export type FetchedTrainerServices = {
  id: number;
  name: string;
  description: string;
  price: number;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
  trainer: {
    id: number;
    fullName: string | null;
    phoneNumber: string | null;
    profileImage: string | null;
  };
  slots: {
    id: number;
    date: string; 
    startTime: string;
    endTime: string;
    durationInMinutes: number;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
    bookings: {
      id: number;
      isConfirmed: boolean;
      createdAt: Date;
      updatedAt: Date;
    }[];
  }[];
};


export type FetchedBrowseService = {
  id: number;
  name: string;
  description: string; // HTML string
  price: string; // API returns "25.00" as string
  attachments: string[];
  createdAt: string; // ISO date string
  updatedAt: string;
  trainer: {
    id: number;
    fullName: string | null;
    phoneNumber: string | null;
    profileImage: string | null;
    email: string | null;
    countryCode: string | null;
    isTrainer: boolean;
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
  };
  slots: {
    id: number;
    date: string;
    startTime: string; 
    endTime: string;  
    durationInMinutes: number;
    isAvailable: boolean;
    createdAt: string;
    updatedAt: string;
    bookings: {
      id: number;
      isConfirmed: boolean;
      createdAt: string;
      updatedAt: string;
    }[];
  }[];
};


export type GeneratedSlot = {
  date: string;
  durationInMinutes: number;
  endTime: string;
  startTime: string;
  isAvailable: boolean;
};

export type ServiceBookingDetails = {
  trainee?: {
    profileImage: string;
    fullName: string;
    phoneNumber: string;
  };
  trainer?: {
    profileImage: string;
    fullName: string;
    phoneNumber: string;
  };
  service: {
    name: string;
    description: string;
  };
  booking: {
    id: number;
    date: string;
    startTime: string;
    endTime: string;
  };
  meeting: {
    link: string;
    startTime: Date;
    endTime: string;
  };
};

export type MeetingInCallMessageType = {
  senderId: number;
  message: string;
  timestamp: Date;
  senderProfileImage: string;
  senderName: string;
};
export interface ActionType {
  type: string;
  payload?: any;
}

export const SET_ALL_FETCHED_TRAINER_SERVICES ="SET_ALL_FETCHED_TRAINER_SERVICES";
export const SET_ALL_FETCHED_ALL_SERVICES = "SET_ALL_FETCHED_ALL_SERVICES";
export const SET_UPDATE_NEW_SERVICE = "SET_UPDATE_NEW_SERVICE";
export const RESET_NEW_SERVICE = "RESET_NEW_SERVICE";
