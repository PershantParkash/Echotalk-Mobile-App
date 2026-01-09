export type CreateServiceDto = {
  name: string;
  description: string;
  price: number;
  attachments: string[];
};

export type UpdateServiceDto = {
  id: number;
  name: string;
  description: string;
  price: number;
  attachments: string[];
};

export type UpdateServiceSlotsDto = {
  date: string;
  startTime: string;
  endTime: string;
  durationInMinutes: number;
  isAvailable: boolean;
};

export type CreateCourseCheckoutRequest = {
  courseIds: number[];
};

export type CreateServiceCheckoutRequest = {
  serviceId: number;
  slotId: number;
};

export type VerifySessionRequest = {
  session_id: string;
};

export type CheckoutSessionResponse = {
  sessionId: string;
  url: string;
};

export type VerifySessionResponse = {
  status: 'paid' | 'unpaid' | 'no_payment_required';
  metadata: {
    userId: string;
    type: 'course_purchase' | 'service_booking';
    courseIds?: string;
    slotId?: string;
    serviceId?: string;
  };
};

export type PaymentMetadata = {
  userId: string;
  type: 'course_purchase' | 'service_booking';
  courseIds?: string;
  slotId?: string;
  serviceId?: string;
};