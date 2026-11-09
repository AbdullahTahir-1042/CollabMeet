import * as api from '../api/index.js';

const SEND = 'SEND';
export const sendMessage = (msg) => async (dispatch) => {
  try {
    const { data } = await api.sendMeetingMessage(msg?.convoId, { text: msg?.message });
    dispatch({ type: SEND, payload: data });
    return data;
  } catch (error) {
    return null;
  }
};