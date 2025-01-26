"use client";

const DeviceRegistration = () => {
  const registerDevice = async () => {
    try {
      await fetch("/api/devices", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error registering device:", error);
    }
  };

  registerDevice();
  return null;
};

export default DeviceRegistration;