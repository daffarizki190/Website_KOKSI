import { useEffect, useRef } from 'react';

interface UseBarcodeScannerProps {
  onScan: (barcode: string) => void;
  debounceTime?: number;
}

export function useBarcodeScanner({ onScan, debounceTime = 50 }: UseBarcodeScannerProps) {
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(Date.now());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;

      // Reset buffer if time between keystrokes is too long (not a scanner)
      if (timeDiff > debounceTime && e.key !== 'Enter') {
        barcodeBuffer.current = '';
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 0) {
          onScan(barcodeBuffer.current);
          barcodeBuffer.current = '';
        }
      } else if (e.key.length === 1) { // Only capture printable characters
        barcodeBuffer.current += e.key;
      }

      lastKeyTime.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan, debounceTime]);
}
