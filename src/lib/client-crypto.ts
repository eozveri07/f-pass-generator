'use client'

import { 
  EncryptionResult, 
  CryptoOptions, 
  DecryptionParams,
  CryptoKeyParams,
  KeyConfig,
  CryptoError
} from './types'

export class ClientCrypto {
  private static readonly DEFAULT_OPTIONS: CryptoOptions = {
    iterations: 600000,
    hashAlgorithm: 'SHA-256',
    keyLength: 256
  }

  static async deriveMasterKey(
    password: string, 
    salt: string, 
    options: CryptoOptions = this.DEFAULT_OPTIONS
  ): Promise<CryptoKey> {
    const enc = new TextEncoder()
    
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    )

    const keyParams: CryptoKeyParams = {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: options.iterations || this.DEFAULT_OPTIONS.iterations!,
      hash: options.hashAlgorithm || this.DEFAULT_OPTIONS.hashAlgorithm!
    }

    const keyConfig: KeyConfig = { 
      name: "AES-GCM", 
      length: options.keyLength || this.DEFAULT_OPTIONS.keyLength! 
    }

    return crypto.subtle.deriveKey(
      keyParams,
      keyMaterial,
      keyConfig,
      false,
      ["encrypt", "decrypt"]
    )
  }

  static async encrypt(
    text: string, 
    masterPassword: string, 
    options?: CryptoOptions
  ): Promise<EncryptionResult> {
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const enc = new TextEncoder()

      const key = await this.deriveMasterKey(
        masterPassword, 
        this.arrayBufferToBase64(salt.buffer), 
        options
      )
      
      const encrypted = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        key,
        enc.encode(text)
      )

      return {
        encryptedData: this.arrayBufferToBase64(encrypted),
        iv: this.arrayBufferToBase64(iv.buffer),
        salt: this.arrayBufferToBase64(salt.buffer)
      }
    } catch (error: unknown) {
      const cryptoError: CryptoError = new Error("Encryption failed")
      if (error instanceof Error) {
        cryptoError.code = "ENCRYPTION_ERROR"
        cryptoError.details = error.message
      }
      throw cryptoError
    }
  }

  static async decrypt(params: DecryptionParams): Promise<string> {
    const { encryptedData, iv, salt, masterPassword } = params
    
    try {
      const key = await this.deriveMasterKey(masterPassword, salt)
      const dec = new TextDecoder()

      const decrypted = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: this.base64ToArrayBuffer(iv)
        },
        key,
        this.base64ToArrayBuffer(encryptedData).buffer
      )

      return dec.decode(decrypted)
    } catch (error: unknown) {
      const cryptoError: CryptoError = new Error("Decryption failed - Invalid master password")
      if (error instanceof Error) {
        cryptoError.code = "DECRYPTION_ERROR"
        cryptoError.details = error.message
      }
      throw cryptoError
    }
  }

  static async hashMasterPassword(password: string): Promise<string> {
    try {
      const enc = new TextEncoder()
      const msgBuffer = enc.encode(password)
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
      return this.arrayBufferToBase64(hashBuffer)
    } catch (error: unknown) {
      const cryptoError: CryptoError = new Error("Hashing failed")
      if (error instanceof Error) {
        cryptoError.code = "HASH_ERROR"
        cryptoError.details = error.message
      }
      throw cryptoError
    }
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer)
    return btoa(String.fromCharCode.apply(null, Array.from(uint8Array)))
  }

  private static base64ToArrayBuffer(base64: string): Uint8Array {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }
}