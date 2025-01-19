import mongoose from 'mongoose'

const groupSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: String
}, {
  timestamps: true
})

export const Group = mongoose.models?.Group || mongoose.model('Group', groupSchema)
export type IGroup = mongoose.InferSchemaType<typeof groupSchema>