const mongoose = require('mongoose');

const toId = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (v._id) return v._id.toString();
  return v.toString ? v.toString() : '';
};
const isId = (v) => mongoose.Types.ObjectId.isValid(v);
const participantKey = (a, b) => [toId(a), toId(b)].sort().join(':');

const isParticipant = (thread, userId) =>
  (thread?.participantIds || []).some((id) => toId(id) === toId(userId));

const otherParticipantId = (thread, userId) => {
  const ids = (thread?.participantIds || []).map(toId);
  return ids.find((id) => id !== toId(userId)) || null;
};

const safeUser = (user) =>
  user ? { _id: toId(user._id), name: user.name || 'User', email: user.email || '' } : null;

const dmForClient = (thread, userId, { includePreview = true } = {}) => {
  if (!thread) return null;
  const pending = thread.status === 'pending';
  const requesterView = pending && toId(thread.requestedBy) === toId(userId);
  const other = (thread.participantIds || []).find((p) => toId(p?._id || p) !== toId(userId));
  return {
    _id: toId(thread._id),
    status: thread.status,
    requestedBy: toId(thread.requestedBy),
    requestFor: toId(thread.requestFor),
    isRequester: toId(thread.requestedBy) === toId(userId),
    isRecipient: toId(thread.requestFor) === toId(userId),
    participants: (thread.participantIds || []).map(safeUser).filter(Boolean),
    otherUser: safeUser(other),
    lastMessageText: includePreview ? thread.lastMessageText || '' : '',
    lastMessageAt: thread.lastMessageAt || thread.updatedAt || thread.createdAt,
    lastMessageSender: thread.lastMessageSender ? toId(thread.lastMessageSender) : null,
    canSeeReadReceipts: thread.status === 'active' && !requesterView,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  };
};

const dmMessageForClient = (msg, thread, userId) => {
  const active = thread?.status === 'active';
  return {
    _id: toId(msg._id),
    threadId: toId(msg.threadId),
    senderId: toId(msg.senderId),
    text: msg.text,
    createdAt: msg.createdAt,
    readBy: active ? (msg.readBy || []).map(toId) : [],
    read: active ? (msg.readBy || []).some((id) => toId(id) !== toId(userId)) : false,
  };
};

module.exports = { toId, isId, participantKey, isParticipant, otherParticipantId, safeUser, dmForClient, dmMessageForClient };
