import mongoose from 'mongoose'

export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

const passwordSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  username: String,
  password: {
    type: String,
    required: true
  },
  recoveryData: String,
  url: String,
  notes: String,
  lastCopied: Date,
  priorityLevel: {
    type: String,
    enum: Object.values(PriorityLevel),
    default: PriorityLevel.LOW
  }
}, {
  timestamps: true
})

export const Password = mongoose.models?.Password || mongoose.model('Password', passwordSchema)