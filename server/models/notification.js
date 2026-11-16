const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    type: { type: String, required: true },
    title: { type: String, default: '' },
    body: { type: String, default: '' },
    refType: { type: String, default: '' },
    refId: { type: String, default: '' },
    readAt: Date,
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.model('notification', notificationSchema);
