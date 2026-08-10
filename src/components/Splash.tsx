import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const Splash = ({ onFinish }: { onFinish: () => void }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 500); // Wait for fade out animation
    }, 1500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 pointer-events-none flex items-center justify-center bg-white z-[9999]"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-24 h-24 bg-teal-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-2xl"
            >
              <span className="text-white text-5xl font-black italic">K</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-slate-900 tracking-tighter"
            >
              KOPERASI INTERNAL
            </motion.h1>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 48 }} // 12 * 4
              transition={{ delay: 0.6 }}
              className="h-1 bg-teal-600 mx-auto mt-2 rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
