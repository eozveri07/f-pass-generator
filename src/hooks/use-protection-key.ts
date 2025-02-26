'use client';

import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { ZeroKnowledgeCrypto } from '@/lib/zero-knowledge-crypto';

export function useProtectionKey() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Oturum başlatma
  const initSession = useCallback(async () => {
    try {
      const protectionKeyCookie = Cookies.get('protection_key');
      
      if (!protectionKeyCookie) {
        setError('Protection key not found');
        return false;
      }
      
      const { masterKey, salt } = JSON.parse(protectionKeyCookie);
      
      // Master key ve salt kullanarak oturumu doğrula ve anahtarı yeniden oluştur
      const success = await ZeroKnowledgeCrypto.validateSession(masterKey, salt);
      
      if (success) {
        setIsReady(true);
        setError(null);
        return true;
      } else {
        setError('Failed to initialize protection key');
        return false;
      }
    } catch (err) {
      setError('Invalid protection key format');
      return false;
    }
  }, []);

  // Şifreleme işlemi
  const encrypt = useCallback(async (data: string) => {
    try {
      if (!isReady) {
        await initSession();
      }
      
      const protectionKey = ZeroKnowledgeCrypto.getStoredProtectionKey();
      
      if (!protectionKey) {
        throw new Error('Protection key not available');
      }
      
      return await ZeroKnowledgeCrypto.encrypt(data, protectionKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Encryption failed');
      throw err;
    }
  }, [isReady, initSession]);

  // Şifre çözme işlemi
  const decrypt = useCallback(async (encryptedData: string, iv: string) => {
    try {
      if (!isReady) {
        await initSession();
      }
      
      const protectionKey = ZeroKnowledgeCrypto.getStoredProtectionKey();
      
      if (!protectionKey) {
        throw new Error('Protection key not available');
      }
      
      return await ZeroKnowledgeCrypto.decrypt({
        encryptedData,
        iv,
        protectionKey
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decryption failed');
      throw err;
    }
  }, [isReady, initSession]);

  // Component yüklendiğinde oturumu başlat
  useEffect(() => {
    initSession();
  }, [initSession]);

  return {
    isReady,
    error,
    encrypt,
    decrypt,
    initSession
  };
} 