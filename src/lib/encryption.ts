// lib/encryption.ts
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const AUTH_TAG_LENGTH = 16
const PBKDF2_ITERATIONS = 600000
const RECOVERY_KEY_LENGTH = 32

interface EncryptedData {
  encryptedText: string
  recoveryData?: string 
}

interface DecryptedData {
  text: string
  recoveryKey?: string
}

export class EncryptionService {
  private static deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      password,
      salt,
      PBKDF2_ITERATIONS,
      32,
      'sha512'
    )
  }

  static encrypt(text: string, masterKey: string): EncryptedData {
    if (!text || !masterKey) {
      throw new Error('Text and master key are required')
    }

    try {
      const iv = crypto.randomBytes(IV_LENGTH)
      const salt = crypto.randomBytes(SALT_LENGTH)
      
      const key = this.deriveKey(masterKey, salt)
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      const authTag = cipher.getAuthTag()

      const recoveryKey = crypto.randomBytes(RECOVERY_KEY_LENGTH).toString('hex')
      
      const recoveryData = this.encryptWithRecoveryKey(text, recoveryKey)

      const mainEncrypted = Buffer.concat([
        salt,
        iv,
        authTag,
        Buffer.from(encrypted, 'hex')
      ]).toString('base64')

      return {
        encryptedText: mainEncrypted,
        recoveryData: recoveryData
      }
    } catch {
      throw new Error('Encryption failed')
    }
  }

  static decrypt(encryptedData: EncryptedData, key: string, isRecovery = false): DecryptedData {
    if (!encryptedData || !key) {
      throw new Error('Encrypted data and key are required')
    }

    try {
      if (isRecovery && encryptedData.recoveryData) {
        return {
          text: this.decryptWithRecoveryKey(encryptedData.recoveryData, key),
          recoveryKey: key
        }
      }

      const buffer = Buffer.from(encryptedData.encryptedText, 'base64')
      
      const salt = buffer.slice(0, SALT_LENGTH)
      const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
      const authTag = buffer.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)
      const encrypted = buffer.slice(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)
      
      const derivedKey = this.deriveKey(key, salt)
      const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv)
      decipher.setAuthTag(authTag)
      
      let decrypted = decipher.update(encrypted)
      decrypted = Buffer.concat([decrypted, decipher.final()])
      
      return { text: decrypted.toString('utf8') }
    } catch {
      throw new Error('Decryption failed')
    }
  }

  private static encryptWithRecoveryKey(text: string, recoveryKey: string): string {
    const iv = crypto.randomBytes(IV_LENGTH)
    const key = crypto.createHash('sha256').update(recoveryKey).digest()
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()

    return Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]).toString('base64')
  }

  private static decryptWithRecoveryKey(encryptedText: string, recoveryKey: string): string {
    const buffer = Buffer.from(encryptedText, 'base64')
    
    const iv = buffer.slice(0, IV_LENGTH)
    const authTag = buffer.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const encrypted = buffer.slice(IV_LENGTH + AUTH_TAG_LENGTH)
    
    const key = crypto.createHash('sha256').update(recoveryKey).digest()
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    
    return decrypted.toString('utf8')
  }

  static generateRecoveryKey(): string {
    return crypto.randomBytes(RECOVERY_KEY_LENGTH).toString('hex')
  }

  static async hashMasterPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  static async verifyMasterPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }
}

export interface PasswordDocument {
  userId: string
  title: string
  username?: string
  password: string
  recoveryData?: string
  url?: string
  notes?: string
  lastCopied?: Date
  createdAt: Date
  updatedAt: Date
}