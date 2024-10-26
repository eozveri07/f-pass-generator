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
      return systemTheme === 'dark' ? "/images/logo-dark.svg" : "/images/logo-light.svg";
    }
    return theme === 'dark' ? "/images/logo-dark.svg" : "/images/logo-light.svg";
  })();

  return (
    <Image
      src={logoSrc}
      alt="Fenrio Logo"
      width={120}
      height={40}
      priority
      decoding="async"
    />
  );
};

export default ThemeAwareLogo;