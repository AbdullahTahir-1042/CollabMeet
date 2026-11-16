import dms, { DMS_SET, DM_THREAD_UPSERT } from '../reducer/dms';
import notifications, { NOTIFICATIONS_SET, NOTIFY_RECEIVE, NOTIFY_READ_ALL } from '../reducer/notifications';
import meetings, { MEETINGS_SET, MEETING_UPSERT } from '../reducer/meetings';
import authReducer from '../reducer/auth';

describe('reducers', () => {
  beforeEach(() => localStorage.clear());

  test('dms set and upsert', () => {
    const s1 = dms(undefined, { type: DMS_SET, payload: [{ _id: '1' }] });
    expect(s1.items).toHaveLength(1);
    const s2 = dms(s1, { type: DM_THREAD_UPSERT, payload: { _id: '1', status: 'active' } });
    expect(s2.items[0].status).toBe('active');
  });

  test('notifications set/receive/read-all', () => {
    let s = notifications(undefined, { type: NOTIFICATIONS_SET, payload: [{ _id: 'n1' }] });
    s = notifications(s, { type: NOTIFY_RECEIVE, payload: { _id: 'n2' } });
    expect(s.items[0]._id).toBe('n2');
    s = notifications(s, { type: NOTIFY_READ_ALL });
    expect(s.items.every((n) => n.readAt)).toBe(true);
  });

  test('meetings upsert by code', () => {
    let s = meetings(undefined, { type: MEETINGS_SET, payload: [{ code: 'c1', title: 'A' }] });
    s = meetings(s, { type: MEETING_UPSERT, payload: { code: 'c1', title: 'B' } });
    expect(s.items).toHaveLength(1);
    expect(s.items[0].title).toBe('B');
  });

  test('auth stores/removes profile', () => {
    let s = authReducer(undefined, { type: 'AUTH', data: { token: 't', result: { _id: 'u' } } });
    expect(JSON.parse(localStorage.getItem('profile')).token).toBe('t');
    s = authReducer(s, { type: 'LOGOUT' });
    expect(localStorage.getItem('profile')).toBeNull();
  });
});
