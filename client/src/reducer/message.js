const SEND = "SEND";

const messageReducer = (state = [], action) => {
  switch (action.type) {
    case SEND:
      return action.payload ? [...state, action.payload] : state;
    default:
      return state;
  }
};

export default messageReducer;