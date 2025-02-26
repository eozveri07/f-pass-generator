'use client'

import { 
  EncryptionResult, 
  MasterKeyData,
  AuthHashData,
  CryptoError
} from './types'

export class ZeroKnowledgeCrypto {
  private static readonly PBKDF2_ITERATIONS = 600000;
  private static readonly SALT_LENGTH = 32;
  private static readonly KEY_LENGTH = 256;
  private static readonly AUTH_ITERATIONS = 1;
  
  // Geçici anahtar saklama için WeakMap kullanımı (sadece bellek içinde, referans tabanlı)
  private static readonly keyStorage = new WeakMap<object, CryptoKey>();
  private static readonly keyIdentifier = {};

  static async deriveMasterKey(password: string): Promise<MasterKeyData> {
    try {
      const masterSalt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      const enc = new TextEncoder();
      
      // Import password for key derivation
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
      );

      // Derive master key
      const masterKey = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: masterSalt,
          iterations: this.PBKDF2_ITERATIONS,
          hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: this.KEY_LENGTH },
        true, // extractable
        ["encrypt", "decrypt"]
      );

      // Derive protection key for data encryption
      const protectionKey = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: new TextEncoder().encode("enc"),
          iterations: 1,
          hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: this.KEY_LENGTH },
        false, // extractable: false - anahtarı dışa aktarılamaz yapıyoruz
        ["encrypt", "decrypt"]
      );
      
      // Anahtarı bellek içinde saklıyoruz
      this.storeProtectionKey(protectionKey);

      // Derive auth key for server verification
      const authKey = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: new TextEncoder().encode("auth"),
          iterations: 1,
          hash: "SHA-256"
        },
        keyMaterial,
        { name: "HMAC", hash: "SHA-256", length: this.KEY_LENGTH },
        true,
        ["sign"]
      );

      return {
        masterKey,
        protectionKey,
        authKey,
        masterSalt: this.arrayBufferToBase64(masterSalt.buffer)
      };
    } catch (error) {
      throw this.handleError("Failed to derive master key", error);
    }
  }
  
  // Anahtarı bellek içinde saklamak için yardımcı metod
  private static storeProtectionKey(key: CryptoKey): void {
    this.keyStorage.set(this.keyIdentifier, key);
  }
  
  // Anahtarı bellek içinden almak için yardımcı metod
  static getStoredProtectionKey(): CryptoKey | undefined {
    return this.keyStorage.get(this.keyIdentifier);
  }
  
  // Oturum doğrulama ve anahtar yenileme
  static async validateSession(masterKey: string, masterSalt: string): Promise<boolean> {
    try {
      const enc = new TextEncoder();
      
      // Import password for key derivation
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(masterKey),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
      );
      
      // Derive protection key for data encryption
      const protectionKey = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: new TextEncoder().encode("enc"),
          iterations: 1,
          hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: this.KEY_LENGTH },
        false,
        ["encrypt", "decrypt"]
      );
      
      // Anahtarı bellek içinde saklıyoruz
      this.storeProtectionKey(protectionKey);
      
      return true;
    } catch (error) {
      console.error("Session validation failed:", error);
      return false;
    }
  }

  static async createAuthHash(authKey: CryptoKey): Promise<AuthHashData> {
    try {
      const authSalt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      
      // Create verifier using authKey
      const verifierBuffer = await crypto.subtle.sign(
        "HMAC",
        authKey,
        authSalt
      );

      return {
        authSalt: this.arrayBufferToBase64(authSalt.buffer),
        authVerifier: this.arrayBufferToBase64(verifierBuffer)
      };
    } catch (error) {
      throw this.handleError("Failed to create auth hash", error);
    }
  }

  static async encrypt(data: string, protectionKey: CryptoKey): Promise<EncryptionResult> {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const enc = new TextEncoder();

      const encrypted = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        protectionKey,
        enc.encode(data)
      );

      return {
        encryptedData: this.arrayBufferToBase64(encrypted),
        iv: this.arrayBufferToBase64(iv.buffer)
      };
    } catch (error) {
      throw this.handleError("Encryption failed", error);
    }
  }

  static async decrypt(params: { 
    encryptedData: string; 
    iv: string; 
    protectionKey: CryptoKey; 
  }): Promise<string> {
    try {
      const { encryptedData, iv, protectionKey } = params;
      const dec = new TextDecoder();

      const decrypted = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: this.base64ToArrayBuffer(iv)
        },
        protectionKey,
        this.base64ToArrayBuffer(encryptedData)
      );

      return dec.decode(decrypted);
    } catch (error) {
      throw this.handleError("Decryption failed", error);
    }
  }

  static async verifyMasterKey(
    password: string, 
    storedAuthSalt: string, 
    storedAuthVerifier: string
  ): Promise<boolean> {
    try {
      const { authKey } = await this.deriveMasterKey(password);
      
      const verifierBuffer = await crypto.subtle.sign(
        "HMAC",
        authKey,
        this.base64ToArrayBuffer(storedAuthSalt)
      );
      
      const verifier = this.arrayBufferToBase64(verifierBuffer);
      return verifier === storedAuthVerifier;
    } catch (error) {
      throw this.handleError("Master key verification failed", error);
    }
  }

  private static handleError(message: string, error: unknown): CryptoError {
    const cryptoError = new Error(message) as CryptoError;
    cryptoError.code = "CRYPTO_ERROR";
    if (error instanceof Error) {
      cryptoError.details = error.message;
    }
    return cryptoError;
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);
    return btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
  }

  private static base64ToArrayBuffer(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}