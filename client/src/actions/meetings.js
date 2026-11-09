import * as api from '../api/index.js';
import { MEETINGS_SET, MEETING_UPSERT } from '../reducer/meetings';

export const fetchMeetings = () => async (dispatch) => {
  try {
    const { data } = await api.getMeetings();
    dispatch({ type: MEETINGS_SET, payload: data });
    return data;
  } catch (e) {
    return null;
  }
};

export const createInstant = (payload) => async (dispatch) => {
  try {
    const { data } = await api.createInstantMeeting(payload);
    if (data) dispatch({ type: MEETING_UPSERT, payload: data });
    return data;
  } catch (e) {
    return null;
  }
};

export const createScheduled = (payload) => async (dispatch) => {
  try {
    const { data } = await api.createScheduledMeeting(payload);
    if (data) dispatch({ type: MEETING_UPSERT, payload: data });
    return data;
  } catch (e) {
    return e?.response?.data || null;
  }
};

export const fetchMeeting = (code) => async (dispatch) => {
  try {
    const { data } = await api.getMeeting(code);
    if (data) dispatch({ type: MEETING_UPSERT, payload: data });
    return data;
  } catch (e) {
    return null;
  }
};
