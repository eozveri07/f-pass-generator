// lib/encryption.ts
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY // 32 byte key
const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY!), iv)
  
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY!), iv)
  
  let decrypted = decipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  
  return decrypted.toString()
}

// Password şifreleme için key generation utility
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Şifreleri hashlemek için utility (opsiyonel ekstra güvenlik)
export function hashMasterKey(masterKey: string): string {
  return crypto.pbkdf2Sync(masterKey, process.env.SALT!, 100000, 64, 'sha512').toString('hex')
}