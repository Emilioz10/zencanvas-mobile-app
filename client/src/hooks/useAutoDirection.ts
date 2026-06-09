import { useEffect, useState } from 'react';
import { detectDirection } from '@/lib/i18n';

export function useAutoDirection(text: string) {
  const [direction, setDirection] = useState<'rtl' | 'ltr'>('ltr');

  useEffect(() => {
    if (text) {
      const detectedDir = detectDirection(text);
      setDirection(detectedDir);
    }
  }, [text]);

  return direction;
}
