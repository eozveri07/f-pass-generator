import mongoose from 'mongoose'

interface RecoveryInfo {
  key?: string
  createdAt?: Date
  lastUsed?: Date
}

const userSchema = new mongoose.Schema({
    name: String,
    email: {
      type: String,
      unique: true
    },
    image: String,
    emailVerified: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: String,
    recoveryInfo: {
      key: String,
      createdAt: Date,
      lastUsed: Date
    }
  }, {
    timestamps: true
  })
export const User = mongoose.models?.User || mongoose.model('User', userSchema)
