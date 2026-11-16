export const NOTIFICATIONS_SET = 'NOTIFICATIONS/SET';
export const NOTIFY_RECEIVE = 'NOTIFICATIONS/RECEIVE';
export const NOTIFY_READ = 'NOTIFICATIONS/READ';
export const NOTIFY_READ_ALL = 'NOTIFICATIONS/READ_ALL';

const initial = { items: [] };

export default function notifications(state = initial, action) {
  switch (action.type) {
    case NOTIFICATIONS_SET:
      return { items: Array.isArray(action.payload) ? action.payload : [] };
    case NOTIFY_RECEIVE:
      return { items: [action.payload, ...state.items.filter((n) => n._id !== action.payload?._id)] };
    case NOTIFY_READ:
      return { items: state.items.map((n) => (n._id === action.payload ? { ...n, readAt: new Date().toISOString() } : n)) };
    case NOTIFY_READ_ALL:
      return { items: state.items.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })) };
    default:
      return state;
  }
}
