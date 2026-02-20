import * as Types from "./services.types";

const initialState: Types.ServicesReducerState = {
  newService: {
    id: null,
    title: "",
    description: "",
    price: 0,
    uploadedMediaUrls: [],
  },
  fetchedTrainerServices: [],
  fetchedAllServices: []
};

export const servicesReducer = (
  state = initialState,
  action: Types.ActionType
) => {
  switch (action.type) {
    case Types.SET_ALL_FETCHED_TRAINER_SERVICES:
      return {
        ...state,
        fetchedTrainerServices: action.payload,
      };
    case Types.SET_ALL_FETCHED_ALL_SERVICES:
      return {
        ...state,
        fetchedAllServices: action.payload,
      };
    case Types.SET_UPDATE_NEW_SERVICE:
      return {
        ...state,
        newService: action.payload,
      };

    case Types.RESET_NEW_SERVICE:
      return {
        ...state,
        newService: {
          id: null,
          title: "",
          description: "",
          price: 0,
          uploadedMediaUrls: [],
        },
      };

    default:
      return state;
  }
};
