import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { useCms } from '../context/CmsContext';

export const NotificationToast = () => {
  const { data } = useCms();
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');

  const messages = [
    'Budi dari Bandung baru saja mencoba demo Omnifyi',
    'Toko Kopi Senja baru saja mendaftar',
    'Sarah dari Surabaya meminta presentasi'
  ];

  useEffect(() => {
    if (!data.settings.toastEnabled) return;

    const interval = setInterval(() => {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setMessage(randomMessage);
      setIsVisible(true);
      
      // Attempt to play sound (might be blocked by browser without interaction, but prompt says "after first interaction")
      try {
         const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
         audio.volume = 0.5;
         const playPromise = audio.play();
         if (playPromise !== undefined) {
             playPromise.catch(() => { /* User hasn't interacted yet */ });
         }
      } catch (e) {
          console.error("Audio play failed");
      }

      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    }, 15000); // Every 15 seconds for demo

    return () => clearInterval(interval);
  }, [data.settings.toastEnabled]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[90] bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-2xl flex items-start gap-4 max-w-sm"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30 text-emerald-400 mt-1">
            <Bell size={18} />
          </div>
          <div>
            <p className="text-white text-sm font-medium leading-snug pr-6">{message}</p>
            <p className="text-slate-400 text-xs mt-1">Baru saja</p>
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 text-slate-500 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
