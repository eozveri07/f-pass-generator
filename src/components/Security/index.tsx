"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor } from "lucide-react";

interface Device {
  _id: string;
  deviceType: string;
  browser: string;
  city: string;
  country: string;
  ipAddress: string;
  isCurrentDevice: boolean;
  lastActive: string;
}

export default function SecurityDevices() {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    const fetchDevices = async () => {
      const response = await fetch('/api/devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
      }
    };
    fetchDevices();
  }, []);

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    const fullDate = date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    
    const time = date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  
    let relativeTime = '';
    if (diffMins < 1) {
      relativeTime = 'Just now';
    } else if (diffMins < 60) {
      relativeTime = `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      relativeTime = `${diffHours} hours ago`;
    }
  
    return `${fullDate} ${time} ${relativeTime ? `(${relativeTime})` : ''}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage your security preferences
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Active Devices</h3>
          <div className="space-y-4">
            {devices.map((device) => (
              <div key={device._id} className="flex items-start space-x-4">
                <Monitor className="h-5 w-5 mt-1" />
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{device.deviceType}</span>
                    {device.isCurrentDevice && (
                      <Badge variant="secondary">Current Device</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {device.browser}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {device.country} • {device.ipAddress}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last active: {formatLastActive(device.lastActive)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}