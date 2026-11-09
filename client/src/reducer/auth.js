const AUTH = "AUTH";
const LOGOUT = "LOGOUT";

// authreducre to handle AUTH and LOGOUT action types
const authReducer = (state = {authData: null}, action) => {
    switch(action.type){
        case AUTH:
            localStorage.setItem('profile', JSON.stringify({...action?.data}));
            return {...state, authData: action?.data};
        case LOGOUT:
            localStorage.removeItem('profile');
            localStorage.removeItem('selectedChatId');
            localStorage.removeItem('currentChat');
            return {...state, authData: null};
        default:
            return state;
    }
}

export default authReducer;