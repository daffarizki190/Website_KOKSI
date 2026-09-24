import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

export const TourGuide: React.FC = () => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTourGuide');
    if (!hasSeenTour) {
      // Small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        setRun(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('hasSeenTourGuide', 'true');
    }
  };

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      content: 'Selamat Datang di BelanjaIn Saza! Mari ikuti tur singkat untuk melihat cara memesan barang.',
      title: 'Selamat Datang',
      disableBeacon: true,
    },
    {
      target: '.tour-search',
      content: 'Anda dapat mencari barang yang Anda butuhkan di sini.',
      title: 'Pencarian Barang',
      disableBeacon: true,
    },
    {
      target: '.tour-categories',
      content: 'Atau pilih dari berbagai kategori barang yang tersedia.',
      title: 'Kategori Barang',
      disableBeacon: true,
    },
    {
      target: '.tour-products',
      content: 'Tekan tombol + untuk menambahkan barang ke keranjang belanja Anda.',
      title: 'Pilih Barang',
      disableBeacon: true,
    },
    {
      target: '.tour-cart',
      content: 'Setelah memilih barang, buka keranjang belanja Anda di sini untuk melakukan Checkout.',
      title: 'Keranjang Belanja',
      disableBeacon: true,
    },
    {
      target: '.tour-history',
      content: 'Pantau status pesanan Anda dan tunjukkan ID Pesanan ke petugas koperasi saat mengambil barang.',
      title: 'Riwayat Pesanan',
      disableBeacon: true,
    }
  ];

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      scrollToFirstStep={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#0f766e', // teal-700
          zIndex: 1000,
        },
        tooltipContainer: {
          textAlign: 'left'
        },
        buttonNext: {
          backgroundColor: '#0d9488' // teal-600
        },
        buttonBack: {
          marginRight: 10
        }
      }}
      locale={{
        back: 'Kembali',
        close: 'Tutup',
        last: 'Selesai',
        next: 'Lanjut',
        skip: 'Lewati Tour'
      }}
    />
  );
};
