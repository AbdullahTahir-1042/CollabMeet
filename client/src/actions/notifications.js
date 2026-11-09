import * as api from '../api/index.js';
import { NOTIFICATIONS_SET, NOTIFY_READ, NOTIFY_READ_ALL } from '../reducer/notifications';

export const fetchNotifications = () => async (dispatch) => {
  try {
    const { data } = await api.getNotifications();
    dispatch({ type: NOTIFICATIONS_SET, payload: data });
    return data;
  } catch (e) {
    return null;
  }
};

export const markRead = (id) => async (dispatch) => {
  try {
    await api.readNotification(id);
    dispatch({ type: NOTIFY_READ, payload: id });
  } catch (e) {}
};

export const markAllRead = () => async (dispatch) => {
  try {
    await api.readAllNotifications();
    dispatch({ type: NOTIFY_READ_ALL });
  } catch (e) {}
};
