// types/crypto.ts

export interface EncryptionResult {
    encryptedData: string
    iv: string
    salt: string
}

export interface CryptoOptions {
    iterations?: number
    hashAlgorithm?: string
    keyLength?: number
}

export interface DecryptionParams {
    encryptedData: string
    iv: string
    salt: string
    masterPassword: string
}

export interface CryptoKeyParams {
    name: string
    salt: Uint8Array
    iterations: number
    hash: string
}

export interface KeyConfig {
    name: string
    length: number
}

export interface CryptoError extends Error {
    code?: string
    details?: string
}

export interface MasterKeyData {
    masterKey: CryptoKey
    protectionKey: CryptoKey
    authKey: CryptoKey
    masterSalt: string
}

export interface AuthHashData {
    authSalt: string
    authVerifier: string
}