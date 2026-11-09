import { relativeTime, clockTime, dayLabel } from '../utils/format';

describe('format utils', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-08T12:00:00Z'));
  });
  afterAll(() => jest.useRealTimers());

  test('relativeTime', () => {
    expect(relativeTime('2026-01-08T12:00:00Z')).toBe('now');
    expect(relativeTime('2026-01-08T11:55:00Z')).toBe('5m');
    expect(relativeTime('2026-01-08T10:00:00Z')).toBe('2h');
    expect(relativeTime('2026-01-06T12:00:00Z')).toBe('2d');
    expect(relativeTime('bad')).toBe('');
    expect(relativeTime(null)).toBe('');
  });

  test('clockTime/dayLabel handle invalid', () => {
    expect(clockTime('bad')).toBe('');
    expect(dayLabel('bad')).toBe('');
    expect(typeof clockTime('2026-01-08T10:30:00Z')).toBe('string');
  });
});
