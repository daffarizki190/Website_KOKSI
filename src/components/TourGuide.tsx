import React, { useState, useEffect } from 'react';
import { Joyride, Step, STATUS } from 'react-joyride';

export const TourGuide: React.FC = () => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const storageKey = isStandalone ? 'hasSeenTourGuide_PWA' : 'hasSeenTourGuide';
    
    const hasSeenTour = localStorage.getItem(storageKey);
    if (!hasSeenTour) {
      // Small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        setRun(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      const storageKey = isStandalone ? 'hasSeenTourGuide_PWA' : 'hasSeenTourGuide';
      localStorage.setItem(storageKey, 'true');
    }
  };

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      content: 'Selamat Datang di BelanjaIn Saza! Mari ikuti panduan singkat untuk melihat cara memesan barang.',
      title: 'Selamat Datang',
    },
    {
      target: '.tour-search',
      content: 'Anda dapat mencari barang yang Anda butuhkan di sini.',
      title: 'Pencarian Barang',
    },
    {
      target: '.tour-categories',
      content: 'Atau pilih dari berbagai kategori barang yang tersedia.',
      title: 'Kategori Barang',
    },
    {
      target: '.tour-products',
      content: 'Tekan tombol + untuk menambahkan barang ke keranjang belanja Anda.',
      title: 'Pilih Barang',
    },
    {
      target: '.tour-cart',
      content: 'Setelah memilih barang, buka keranjang belanja Anda di sini untuk melakukan Checkout.',
      title: 'Keranjang Belanja',
    },
    {
      target: '.tour-history',
      content: 'Pantau status pesanan Anda dan tunjukkan ID Pesanan ke petugas koperasi saat mengambil barang.',
      title: 'Riwayat Pesanan',
    }
  ];

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      scrollToFirstStep={true}
      onEvent={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: '#ffffff',
          backgroundColor: '#ffffff',
          primaryColor: '#0d9488', // teal-600
          textColor: '#334155', // slate-700
          overlayColor: 'rgba(15, 23, 42, 0.65)', // dark overlay
          zIndex: 9999,
        },
        tooltip: {
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          fontFamily: 'inherit',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '18px',
          fontWeight: 800,
          color: '#0f766e', // teal-700
          marginBottom: '10px',
        },
        tooltipContent: {
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#475569', // slate-600
          paddingRight: '10px'
        },
        buttonPrimary: {
          backgroundColor: '#0d9488',
          borderRadius: '10px',
          padding: '10px 18px',
          fontWeight: 700,
          fontSize: '13px',
          border: 'none'
        },
        buttonBack: {
          marginRight: '14px',
          color: '#64748b', // slate-500
          fontWeight: 600,
          fontSize: '13px',
        },
        buttonSkip: {
          color: '#94a3b8', // slate-400
          fontSize: '13px',
          fontWeight: 600,
        },
      }}
      locale={{
        back: 'Kembali',
        close: 'Tutup',
        last: 'Mulai Belanja',
        next: 'Lanjut',
        skip: 'Lewati'
      }}
    />
  );
};
