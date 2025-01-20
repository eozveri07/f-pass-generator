"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface TwoFactorStatus {
  enabled: boolean;
  isUnlocked: boolean;
  lastUnlocked?: string;
  remainingTime?: number;
}

interface TwoFactorContextType {
  status: TwoFactorStatus | null;
  remainingTime: number;
  isLoading: boolean;
  fetchStatus: () => Promise<void>;
}

const TwoFactorContext = createContext<TwoFactorContextType | undefined>(
  undefined
);

export function TwoFactorProvider({
  children,
  pollInterval = 10000,
}: {
  children: ReactNode;
  pollInterval?: number;
}) {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [remainingTime, setRemainingTime] = useState(300);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      const data = await res.json();
      setStatus(data);
      if (data.remainingTime) {
        setRemainingTime(data.remainingTime);
      }
    } catch (error) {
      console.error("Error fetching 2FA status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  const value = {
    status,
    remainingTime,
    isLoading,
    fetchStatus,
  };

  return (
    <TwoFactorContext.Provider value={value}>
      {children}
    </TwoFactorContext.Provider>
  );
}

export function useTwoFactor() {
  const context = useContext(TwoFactorContext);
  if (context === undefined) {
    throw new Error("useTwoFactor must be used within a TwoFactorProvider");
  }
  return context;
}
