import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EditableText, EditableImage, EditableList } from './EditableElements';
import { ArrowRight, PlayCircle, Activity, Banknote, ShieldCheck, Zap, WifiOff } from 'lucide-react';
import { LeadFormPopup } from './LeadFormPopup';
import { useLandingLoginView } from '../context/LandingLoginViewContext';

type HeroProps = {
  /** Kartu login POS (Supabase + demo) — hanya ditampilkan jika `showAuthPanel` di context */
  authPanel?: React.ReactNode;
};

export const Hero = ({ authPanel }: HeroProps) => {
  const { showAuthPanel, formPulseKey } = useLandingLoginView();
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  /** Selama panel login aktif, mockup kanan disembunyikan (gambar & form tidak bersamaan). */
  const showHeroMockup = !showAuthPanel;

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-950 min-h-screen flex items-center">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(15,118,110,0.15),transparent_50%)]"></div>
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <EditableText path="hero.label" tag="span" />
            </div>
            
            <EditableText 
              path="hero.headline" 
              tag="h1" 
              className="text-4xl lg:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight"
            />
            
            <EditableText 
              path="hero.subheadline" 
              tag="p" 
              className="text-xl lg:text-2xl text-slate-300 mb-8 font-light"
            />
            
            <div className="flex flex-wrap gap-4 mb-10">
              <button 
                onClick={() => setIsLeadFormOpen(true)}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 flex items-center gap-2 text-lg"
              >
                <EditableText path="hero.cta1" tag="span" />
                <ArrowRight size={20} />
              </button>
              
              <button 
                onClick={() => setIsLeadFormOpen(true)}
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-white/10 transition-all flex items-center gap-2 text-lg"
              >
                <EditableText path="hero.cta2" tag="span" />
                <PlayCircle size={20} />
              </button>
            </div>
            
            {/* Features Strip */}
            <div className="pt-8 border-t border-white/10">
               <p className="text-sm text-slate-400 mb-4 font-semibold uppercase tracking-wider">Fitur Lengkap Omnifyi</p>
               <EditableList 
                 path="hero.featuresStrip" 
                 className="flex flex-wrap gap-2 gap-y-3"
                 itemClassName="bg-slate-800/50"
                 renderItem={(item) => (
                    <span className="text-sm font-medium text-slate-300 flex items-center gap-1.5 px-3 py-1 bg-slate-800/50 rounded-md border border-slate-700/50">
                        <Zap size={14} className="text-emerald-500" />
                        {item}
                    </span>
                 )}
               />
            </div>
          </motion.div>
          
          <div className="flex flex-col gap-8">
          {showHeroMockup ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Main Mockup Container */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/40 border border-white/10 bg-slate-900 aspect-[4/3] group">
               <EditableImage path="hero.imageUrl" alt="Omnifyi Dashboard" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
               
               {/* Overlay gradients for better integration */}
               <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
               <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-transparent"></div>
            </div>
            
            {/* Floating Trust Chips */}
            <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute -top-6 -right-6 bg-slate-800/90 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-xl flex items-center gap-3 z-20"
            >
               <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
                  <Banknote size={18} />
               </div>
               <div>
                  <p className="text-white font-bold text-xs">Anti selisih kas</p>
                  <p className="text-emerald-400 text-[10px] font-medium">100% Akurat</p>
               </div>
            </motion.div>
            
            <motion.div 
               animate={{ x: [0, 10, 0] }}
               transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
               className="absolute top-1/4 -left-10 bg-slate-800/90 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-xl flex items-center gap-3 z-20"
            >
               <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                  <Activity size={18} />
               </div>
               <div>
                  <p className="text-white font-bold text-xs">Pantau transaksi realtime</p>
                  <p className="text-blue-400 text-[10px] font-medium">Update setiap detik</p>
               </div>
            </motion.div>

            <motion.div 
               animate={{ y: [0, 10, 0] }}
               transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               className="absolute -bottom-8 -left-4 bg-slate-800/90 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-xl flex items-center gap-3 z-20"
            >
               <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400">
                  <WifiOff size={18} />
               </div>
               <div>
                  <p className="text-white font-bold text-xs">Tetap jalan saat offline</p>
                  <p className="text-amber-400 text-[10px] font-medium">Tanpa kendala sinyal</p>
               </div>
            </motion.div>

            <motion.div 
               animate={{ scale: [1, 1.05, 1] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
               className="absolute bottom-1/4 -right-8 bg-slate-800/90 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-xl flex items-center gap-3 z-20"
            >
               <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400">
                  <ShieldCheck size={18} />
               </div>
               <div>
                  <p className="text-white font-bold text-xs">Kontrol usaha lebih rapi</p>
                  <p className="text-purple-400 text-[10px] font-medium">Sistem terintegrasi</p>
               </div>
            </motion.div>
            
          </motion.div>
          ) : null}

          {showAuthPanel && authPanel ? (
            <motion.div
              id="auth-login"
              key={formPulseKey}
              className="scroll-mt-32 relative z-30 w-full rounded-2xl"
              initial={formPulseKey > 0 ? { scale: 0.92, opacity: 0.82 } : false}
              animate={
                formPulseKey > 0
                  ? {
                      scale: 1,
                      opacity: 1,
                      boxShadow: [
                        '0 0 0 0 rgba(16, 185, 129, 0)',
                        '0 0 0 12px rgba(16, 185, 129, 0.18)',
                        '0 0 0 0 rgba(16, 185, 129, 0)',
                      ],
                    }
                  : { scale: 1, opacity: 1 }
              }
              transition={
                formPulseKey > 0
                  ? {
                      scale: { type: 'spring', stiffness: 480, damping: 19, mass: 0.82 },
                      opacity: { duration: 0.22 },
                      boxShadow: { duration: 0.7, times: [0, 0.4, 1] },
                    }
                  : { duration: 0 }
              }
            >
              {authPanel}
            </motion.div>
          ) : null}
          </div>
          
        </div>
      </div>
      
      {isLeadFormOpen && (
          <LeadFormPopup onClose={() => setIsLeadFormOpen(false)} />
      )}
    </section>
  );
};
