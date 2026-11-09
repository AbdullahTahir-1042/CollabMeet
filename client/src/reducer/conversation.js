const CREATE = "CREATE";
const GET_ALL = "GET_ALL";
const GET_CONVO = "GET_CONVO";

const conversationReducer = (state = [], action) => {
  switch (action.type) {
    case CREATE:
      return [...state, action.payload].filter(Boolean);
    case GET_ALL:
      return Array.isArray(action.payload) ? action.payload : [];
    case GET_CONVO:
      return state;
    default:
      return state;
  }
};

export default conversationReducer;