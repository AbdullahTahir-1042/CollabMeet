const crypto = require('crypto');
const Meeting = require('../models/meeting');

const normalizeCode = (v) => (v || '').toString().trim();
const codeFromId = (id) => (id ? id.toString() : '');

const generateCode = async () => {
  for (let i = 0; i < 8; i += 1) {
    const code = crypto.randomBytes(5).toString('base64url').slice(0, 10);
    // eslint-disable-next-line no-await-in-loop
    const exists = await Meeting.findOne({ code });
    if (!exists) return code;
  }
  return crypto.randomBytes(8).toString('base64url');
};

const findMeetingByCode = async (code) => {
  const raw = normalizeCode(code);
  if (!raw) return null;
  let meeting = await Meeting.findOne({ code: raw });
  if (meeting) return meeting;
  // legacy compatibility: treat old conversation id / chatId as meeting code
  if (/^[a-f\d]{24}$/i.test(raw)) {
    meeting = await Meeting.findById(raw);
  }
  return meeting;
};

const canJoinScheduled = (meeting, now = new Date()) => {
  if (!meeting || meeting.type !== 'scheduled') return true;
  if (['ended', 'cancelled'].includes(meeting.status)) return false;
  if (!meeting.startsAt) return true;
  return now.getTime() >= new Date(meeting.startsAt).getTime();
};

const meetingForClient = (meeting) => {
  if (!meeting) return null;
  return {
    _id: meeting._id.toString(),
    type: meeting.type,
    title: meeting.title || 'Meeting',
    code: meeting.code || meeting._id.toString(),
    hostId: meeting.hostId?.toString?.() || meeting.hostId,
    status: meeting.status,
    startsAt: meeting.startsAt || null,
    endsAt: meeting.endsAt || null,
    createdAt: meeting.createdAt,
    updatedAt: meeting.updatedAt,
  };
};

module.exports = { normalizeCode, codeFromId, generateCode, findMeetingByCode, canJoinScheduled, meetingForClient };
