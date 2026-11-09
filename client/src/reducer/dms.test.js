import dms, { DMS_SET, DMS_REQUESTS_SET, DM_THREAD_UPSERT } from '../reducer/dms';

describe('dms reducer requests', () => {
  test('keeps incoming pending request in requests on upsert', () => {
    let s = dms(undefined, { type: DMS_REQUESTS_SET, payload: [{ _id: '1', status: 'pending', isRecipient: true }] });
    s = dms(s, { type: DM_THREAD_UPSERT, payload: { _id: '1', status: 'pending', isRecipient: true, lastMessageText: 'hi' } });
    expect(s.requests).toHaveLength(1);
    expect(s.requests[0].lastMessageText).toBe('hi');
  });
  test('removes request when no longer incoming pending', () => {
    let s = dms(undefined, { type: DMS_REQUESTS_SET, payload: [{ _id: '1', status: 'pending', isRecipient: true }] });
    s = dms(s, { type: DM_THREAD_UPSERT, payload: { _id: '1', status: 'active', isRecipient: false } });
    expect(s.requests).toHaveLength(0);
  });
});
