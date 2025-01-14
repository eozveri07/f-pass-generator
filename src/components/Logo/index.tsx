"use client";
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import LightLogo from '/public/images/logo-light.svg';
import DarkLogo from '/public/images/logo-dark.svg';

const ThemeAwareLogo = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, systemTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-[120px] h-[40px] bg-gray-200 animate-pulse" />
    );
  }

  const Logo = (() => {
    if (theme === 'system') {
      return systemTheme === 'dark' ? DarkLogo : LightLogo;
    }
    return theme === 'dark' ? DarkLogo : LightLogo;
  })();

  return (
    <Logo 
      className="w-[120px] h-[40px] transform-gpu" 
      alt="Fenrio Logo"
    />
  );
};

export default ThemeAwareLogo;