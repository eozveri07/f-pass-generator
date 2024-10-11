"use client";

import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const ThemeAwareLogo = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, systemTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const logoSrc = (() => {
    if (theme === 'system') {
      return systemTheme === 'dark' ? "/images/logo-dark.png" : "/images/logo-light.png";
    }
    return theme === 'dark' ? "/images/logo-dark.png" : "/images/logo-light.png";
  })();

  return (
    <Image
      src={logoSrc}
      alt="Fenrio Logo"
      width={120}
      height={40}
      priority
    />
  );
};

export default ThemeAwareLogo;