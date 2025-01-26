import mongoose from 'mongoose'

const deviceSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  deviceType: { type: String, required: true },
  browser: { type: String, required: true },
  ipAddress: { type: String, required: true },
  city: { type: String, default: 'Unknown' },
  country: { type: String, default: 'Unknown' },
  timezone: { type: String, default: 'UTC' },
  lastActive: { type: Date, default: Date.now },
  isCurrentDevice: { type: Boolean, default: false }
})

export const Device = mongoose.models.Device || mongoose.model('Device', deviceSchema)