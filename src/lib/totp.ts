// lib/totp.ts
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

authenticator.options = {
  window: 45,       
  step: 30,       
  digits: 6
}

export class TOTPService {
  static generateSecret(email: string): { secret: string; otpauth_url: string } {
    const appName = 'Password Manager'
    const secret = authenticator.generateSecret()
    const otpauth_url = authenticator.keyuri(email, appName, secret)
    return { secret, otpauth_url }
  }

  static async verifyToken(token: string, secret: string): Promise<boolean> {
    try {
      const cleanToken = token.replace(/\s+/g, '').trim()
      
      if (cleanToken.length !== 6) {
        throw new Error('Token must be 6 digits')
      }

      const isValid = authenticator.verify({
        token: cleanToken,
        secret: secret.trim()
      })

      console.log('Verification attempt:', {
        token: cleanToken,
        currentTime: Math.floor(Date.now() / 1000),
        expectedToken: authenticator.generate(secret),
        result: isValid
      })

      return isValid
    } catch (error) {
      console.error('TOTP Verification Error:', error)
      return false
    }
  }

  static async generateQRCode(otpauth_url: string): Promise<string> {
    return QRCode.toDataURL(otpauth_url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
  }
}