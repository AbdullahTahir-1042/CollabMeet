export const DMS_SET = 'DMS/SET';
export const DMS_REQUESTS_SET = 'DMS/REQUESTS_SET';
export const DM_THREAD_UPSERT = 'DMS/THREAD_UPSERT';
export const DM_REQUEST_RECEIVED = 'DMS/REQUEST_RECEIVED';
export const DM_ACCEPTED = 'DMS/ACCEPTED';

const initial = { items: [], requests: [], requestVersion: 0 };

export default function dms(state = initial, action) {
  switch (action.type) {
    case DMS_SET:
      return { ...state, items: Array.isArray(action.payload) ? action.payload : [] };
    case DMS_REQUESTS_SET:
      return { ...state, requests: Array.isArray(action.payload) ? action.payload : [] };
    case DM_THREAD_UPSERT: {
      const t = action.payload;
      if (!t?._id) return state;
      const items = [t, ...state.items.filter((x) => x._id !== t._id)];
      const incomingRequest = t.status === 'pending' && t.isRecipient;
      let requests = state.requests.filter((x) => x._id !== t._id);
      if (incomingRequest) requests = [t, ...requests];
      return { ...state, items, requests };
    }
    case DM_REQUEST_RECEIVED:
    case DM_ACCEPTED:
      return { ...state, requestVersion: state.requestVersion + 1 };
    default:
      return state;
  }
}
