const mongoose = require('mongoose');

const dmThreadSchema = new mongoose.Schema(
  {
    participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true }],
    participantKey: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ['pending', 'active', 'declined', 'blocked'], default: 'pending', index: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    requestFor: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, index: true },
    acceptedAt: Date,
    declinedAt: Date,
    lastMessageText: { type: String, default: '' },
    lastMessageAt: Date,
    lastMessageSender: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  },
  { timestamps: true }
);

dmThreadSchema.index({ requestFor: 1, status: 1, updatedAt: -1 });
dmThreadSchema.index({ participantIds: 1, updatedAt: -1 });

module.exports = mongoose.model('dmThread', dmThreadSchema);
