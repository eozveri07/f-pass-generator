"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TwoFactorSetup } from "@/components/2fa";
import {
  ShieldPlus,
  ShieldCheck,
  ShieldAlert,
  ShieldMinus,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface TwoFactorStatus {
  enabled: boolean;
  isUnlocked: boolean;
  lastUnlocked?: string;
  remainingTime?: number;
}

export function TwoFactorDialog() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] =
    useState<TwoFactorStatus | null>(null);
  const [unlockToken, setUnlockToken] = useState("");
  const [remainingTime, setRemainingTime] = useState(300); // 5 minutes in seconds
  const { toast } = useToast();

  const fetchTwoFactorStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/2fa/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      const data = await res.json();
      setTwoFactorStatus(data);
      if (data.remainingTime) {
        setRemainingTime(data.remainingTime);
      }
    } catch (error) {
      console.error("Error fetching 2FA status:", error);
      toast({
        title: "Error",
        description: "Failed to fetch 2FA status",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchTwoFactorStatus();
    const interval = setInterval(fetchTwoFactorStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchTwoFactorStatus]);

  // Countdown timer for unlocked state
  useEffect(() => {
    if (twoFactorStatus?.isUnlocked && remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [twoFactorStatus?.isUnlocked, remainingTime]);

  const handleUnlock = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: unlockToken }),
      });

      if (!res.ok) throw new Error("Invalid token");

      await fetchTwoFactorStatus();
      setUnlockToken("");
      toast({
        title: "Success",
        description: "2FA unlocked for 5 minutes",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: "lock" | "disable") => {
    setIsLoading(true);
    const endpoint =
      action === "lock" ? "/api/auth/2fa/lock" : "/api/auth/2fa/disable";
    const successMessage =
      action === "lock" ? "2FA has been locked" : "2FA has been removed";
    const errorMessage =
      action === "lock" ? "Failed to lock 2FA" : "Failed to remove 2FA";

    try {
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) throw new Error(`${action} failed`);

      await fetchTwoFactorStatus();
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: successMessage,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const TwoFactorIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 mr-2 animate-spin" />;
    if (!twoFactorStatus?.enabled)
      return <ShieldPlus className="h-4 w-4 mr-2" />;
    if (!twoFactorStatus.isUnlocked)
      return <ShieldAlert className="h-4 w-4 mr-2" />;
    return <ShieldCheck className="h-4 w-4 mr-2" />;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderUnlockSection = () => (
    <div className="space-y-4">
      <Input
        value={unlockToken}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9]/g, "");
          if (value.length <= 6) setUnlockToken(value);
        }}
        placeholder="Enter 6-digit code"
        maxLength={6}
        type="text"
        pattern="[0-9]*"
        className="text-center text-2xl tracking-wider"
      />
      <Button
        onClick={handleUnlock}
        disabled={unlockToken.length !== 6 || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Verifying...
          </>
        ) : (
          "Unlock"
        )}
      </Button>
    </div>
  );

  const renderManagementButtons = () => (
    <div className="grid grid-cols-2 gap-4">
      <Button
        variant="outline"
        onClick={() => handleAction("lock")}
        disabled={isLoading}
        className="w-full"
      >
        <ShieldAlert className="h-4 w-4 mr-2" />
        Lock 2FA
      </Button>
      <Button
        variant="destructive"
        onClick={() => handleAction("disable")}
        disabled={isLoading}
        className="w-full"
      >
        <ShieldMinus className="h-4 w-4 mr-2" />
        Remove 2FA
      </Button>
    </div>
  );

  const renderUnlockedStatus = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <DialogTitle>2FA Status</DialogTitle>
          <span className="text-sm text-green-500 font-medium">
            {formatTime(remainingTime)} remaining
          </span>
        </div>
        <DialogDescription>
          Your 2FA is currently active and unlocked
        </DialogDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-center p-4">
            <ShieldCheck className="h-16 w-16 text-green-500" />
          </div>
          <Progress value={(remainingTime / 300) * 100} className="h-2" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="grid grid-cols-2 gap-4 w-full">
          <Button
            variant="outline"
            onClick={() => handleAction("lock")}
            className="w-full"
          >
            <ShieldAlert className="h-4 w-4 mr-2" />
            Lock Now
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleAction("disable")}
            disabled={isLoading}
            className="w-full"
          >
            <ShieldMinus className="h-4 w-4 mr-2" />
            Remove 2FA
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  const renderLockedStatus = () => (
    <Card>
      <CardHeader>
        <DialogTitle>2FA Management</DialogTitle>
        <DialogDescription>
          Unlock 2FA to manage your settings
        </DialogDescription>
      </CardHeader>
      <CardContent className="space-y-6">{renderUnlockSection()}</CardContent>
    </Card>
  );

  const renderDialogContent = () => {
    if (!twoFactorStatus?.enabled) {
      return (
        <TwoFactorSetup
          onSuccess={() => {
            setIsDialogOpen(false);
            fetchTwoFactorStatus();
          }}
        />
      );
    }

    return twoFactorStatus.isUnlocked
      ? renderUnlockedStatus()
      : renderLockedStatus();
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`${
            twoFactorStatus?.isUnlocked
              ? "bg-green-50 hover:bg-green-100 border-green-200"
              : ""
          }`}
        >
          <TwoFactorIcon />
          {!twoFactorStatus?.enabled
            ? "Setup 2FA"
            : twoFactorStatus.isUnlocked
            ? "2FA Active"
            : "Unlock 2FA"}
        </Button>
      </DialogTrigger>
      <DialogContent>{renderDialogContent()}</DialogContent>
    </Dialog>
  );
}
