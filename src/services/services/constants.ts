export const ServicesEndpointsV1 = Object.freeze({
  createService: "/v1/services",
  getAllServices: "/v1/services",
  getTrainerServices: "v1/services/trainer",
  updateService: "v1/services",
  deleteService: "v1/services",
  updateServiceSlots: (serviceId: number) =>
    `v1/services/${serviceId}/slots/add`,
  getServiceSlots: (serviceId: number) => `v1/services/${serviceId}/slots`,
  getServiceDetails: "v1/services/details",
  bookServiceSlot: (slotId: number) => `v1/services/${slotId}/book`,
  getAllBookedServiceUser: "v1/services/booked/user",
  getAllBookedServiceTrainer: "v1/services/booked/trainer",
  getMeetingDetails: "v1/services/meeting",
  createCourseCheckout: 'v1/payment/create-course-checkout',
  createServiceCheckout: 'v1/payment/create-service-checkout',
  verifySession: 'v1/payment/verify-session',
});
