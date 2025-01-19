import mongoose from 'mongoose'

const tagSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: "#000000"
  }
}, {
  timestamps: true
})

export const Tag = mongoose.models?.Tag || mongoose.model('Tag', tagSchema)
export type ITag = mongoose.InferSchemaType<typeof tagSchema>