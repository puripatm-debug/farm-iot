'use client';

import { useEffect } from 'react';

export default function BootstrapClient() {
  useEffect(() => {
    import('bootstrap').then(() => {
      console.log('Bootstrap JS loaded');
    });
  }, []);

  return null;
}
