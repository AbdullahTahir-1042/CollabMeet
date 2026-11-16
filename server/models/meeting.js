const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['instant', 'scheduled'], required: true },
    title: { type: String, default: 'Meeting' },
    code: { type: String, required: true, unique: true, index: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, index: true },
    inviteeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    status: { type: String, enum: ['scheduled', 'live', 'ended', 'cancelled'], default: 'scheduled', index: true },
    startsAt: Date,
    endsAt: Date,
    startedAt: Date,
    endedAt: Date,
  },
  { timestamps: true }
);

meetingSchema.index({ hostId: 1, startsAt: -1, createdAt: -1 });
meetingSchema.index({ inviteeIds: 1, startsAt: -1 });

module.exports = mongoose.model('meeting', meetingSchema);
