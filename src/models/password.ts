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
  encryptedData: {  
    type: String,
    required: true
  },
  iv: {        
    type: String,
    required: true
  },
  salt: {      
    type: String,
    required: true
  },
  url: String,
  notes: String,
  priorityLevel: {
    type: String,
    enum: Object.values(PriorityLevel),
    default: PriorityLevel.LOW
  },
  lastCopied: Date,
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag',
    required: false
  }]
}, {
  timestamps: true
})

export const Password = mongoose.models?.Password || mongoose.model('Password', passwordSchema)
export type IPassword = mongoose.InferSchemaType<typeof passwordSchema>