import * as Types from "./services.types";

export const setAllFetchedTrainerServices = (
  payload: Types.FetchedTrainerServices[]
) => ({
  type: Types.SET_ALL_FETCHED_TRAINER_SERVICES,
  payload: payload,
});
export const setAllFetchedAllServices = (
  payload: Types.FetchedBrowseService
) => ({
  type: Types.SET_ALL_FETCHED_ALL_SERVICES,
  payload: payload,
});

export const setUpdateNewService = (payload: Partial<Types.CreateService>) => ({
  type: Types.SET_UPDATE_NEW_SERVICE,
  payload: payload,
});

export const resetNewService = () => ({
  type: Types.RESET_NEW_SERVICE,
});
