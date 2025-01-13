import mongoose from 'mongoose'

const passwordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
  },
  username: String, 
  password: {
    type: String,
    required: true
  },
  url: String, 
  notes: String, 
  lastCopied: Date, 
}, {
  timestamps: true 
})

export const Password = mongoose.models?.Password || mongoose.model('Password', passwordSchema)