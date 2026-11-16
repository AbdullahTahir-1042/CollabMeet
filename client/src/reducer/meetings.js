export const MEETINGS_SET = 'MEETINGS/SET';
export const MEETING_UPSERT = 'MEETINGS/UPSERT';

const initial = { items: [] };

export default function meetings(state = initial, action) {
  switch (action.type) {
    case MEETINGS_SET:
      return { items: Array.isArray(action.payload) ? action.payload : [] };
    case MEETING_UPSERT: {
      const m = action.payload;
      if (!m?.code && !m?._id) return state;
      const key = m.code || m._id;
      const rest = state.items.filter((x) => (x.code || x._id) !== key);
      return { items: [m, ...rest] };
    }
    default:
      return state;
  }
}
