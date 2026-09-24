import React, { useState, useEffect } from 'react';
import { Joyride, Step, STATUS } from 'react-joyride';

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

  const handleJoyrideCallback = (data: any) => {
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
      callback={handleJoyrideCallback}
      options={{
        primaryColor: '#0f766e', // teal-700
        zIndex: 1000,
        showProgress: true,
        buttons: ['skip', 'back', 'close', 'primary'],
      }}
      styles={{
        tooltipContainer: {
          textAlign: 'left'
        },
        buttonPrimary: {
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
        skip: 'Lewati Panduan'
      }}
    />
  );
};
