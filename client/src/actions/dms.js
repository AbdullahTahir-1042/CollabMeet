import * as api from '../api/index.js';
import { DMS_SET, DMS_REQUESTS_SET, DM_THREAD_UPSERT } from '../reducer/dms';

export const fetchDms = () => async (dispatch) => {
  try {
    const { data } = await api.getDms();
    dispatch({ type: DMS_SET, payload: data });
    return data;
  } catch (e) {
    return null;
  }
};

export const fetchDmRequests = () => async (dispatch) => {
  try {
    const { data } = await api.getDmRequests();
    dispatch({ type: DMS_REQUESTS_SET, payload: data });
    return data;
  } catch (e) {
    return null;
  }
};

export const startNewDm = (payload) => async (dispatch) => {
  try {
    const { data } = await api.startDm(payload);
    if (data?.thread) dispatch({ type: DM_THREAD_UPSERT, payload: data.thread });
    return data;
  } catch (e) {
    return e?.response?.data || null;
  }
};

export const fetchDmThread = (threadId) => async (dispatch) => {
  try {
    const { data } = await api.getDmMessages(threadId);
    if (data?.thread) dispatch({ type: DM_THREAD_UPSERT, payload: data.thread });
    return data;
  } catch (e) {
    return null;
  }
};

export const sendDm = (threadId, payload) => async (dispatch) => {
  try {
    const { data } = await api.sendDmMessage(threadId, payload);
    if (data?.thread) dispatch({ type: DM_THREAD_UPSERT, payload: data.thread });
    return data;
  } catch (e) {
    return e?.response?.data || null;
  }
};

export const acceptDm = (threadId) => async (dispatch) => {
  try {
    const { data } = await api.acceptDmRequest(threadId);
    if (data?.thread) dispatch({ type: DM_THREAD_UPSERT, payload: data.thread });
    return data;
  } catch (e) {
    return null;
  }
};

export const declineDm = (threadId) => async (dispatch) => {
  try {
    const { data } = await api.declineDmRequest(threadId);
    return data;
  } catch (e) {
    return null;
  }
};
