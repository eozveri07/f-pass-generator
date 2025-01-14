import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
    required: true
  },
  image: String,
  emailVerified: Date,
  masterKeyHash: String,  
  masterKeySetAt: Date,   
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
}, {
  timestamps: true
})

// Tüm alanları güncellemeye izin ver
userSchema.set('strict', false)

export const User = mongoose.models?.User || mongoose.model('User', userSchema)