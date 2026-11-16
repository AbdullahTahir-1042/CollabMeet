const mongoose = require('mongoose');

const dmMessageSchema = new mongoose.Schema(
  {
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'dmThread', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    text: { type: String, required: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
  },
  { timestamps: true }
);

dmMessageSchema.index({ threadId: 1, createdAt: 1 });

module.exports = mongoose.model('dmMessage', dmMessageSchema);
