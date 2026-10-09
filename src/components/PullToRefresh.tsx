import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const MAX_PULL = 100;

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    const y = e.touches[0].clientY;
    const distance = y - startY;
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, MAX_PULL));
      if (e.cancelable) e.preventDefault();
    }
  };

  const onTouchEnd = async () => {
    setIsPulling(false);
    if (pullDistance > 60) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  };

  return (
    <div 
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative w-full h-full overflow-hidden"
    >
      <div 
        className="absolute top-0 left-0 w-full flex justify-center items-center transition-transform duration-200"
        style={{
          transform: `translateY(${isRefreshing ? 60 : pullDistance}px)`,
          opacity: Math.min((pullDistance / 60) * 1, 1),
          zIndex: 50,
          marginTop: -40
        }}
      >
        <div className="bg-white p-2 shadow-md rounded-full text-teal-600">
          <RefreshCw className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 2}deg)` }} />
        </div>
      </div>
      
      <div 
        className="h-full w-full transition-transform duration-200"
        style={{
          transform: `translateY(${isRefreshing ? 60 : pullDistance * 0.3}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
