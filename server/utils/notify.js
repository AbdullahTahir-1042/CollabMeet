const Notification = require('../models/notification');

const emitToUser = (io, userId, event, payload) => {
  if (!io || !userId) return;
  io.to(`user:${userId.toString()}`).emit(event, payload);
};

const createAndEmit = async (io, { userId, actorId, type, title, body, refType, refId, meta }) => {
  try {
    const doc = await Notification.create({ userId, actorId, type, title, body, refType, refId, meta });
    emitToUser(io, userId, 'notification:new', {
      _id: doc._id.toString(),
      type: doc.type,
      title: doc.title,
      body: doc.body,
      refType: doc.refType,
      refId: doc.refId,
      readAt: doc.readAt || null,
      createdAt: doc.createdAt,
      meta: doc.meta || {},
    });
    return doc;
  } catch (e) {
    return null;
  }
};

module.exports = { emitToUser, createAndEmit };
