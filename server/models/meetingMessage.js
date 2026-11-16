const mongoose = require('mongoose');

const meetingMessageSchema = new mongoose.Schema(
  {
    meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'meeting', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    senderName: { type: String, default: 'Guest' },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

meetingMessageSchema.index({ meetingId: 1, createdAt: 1 });

module.exports = mongoose.model('meetingMessage', meetingMessageSchema);
