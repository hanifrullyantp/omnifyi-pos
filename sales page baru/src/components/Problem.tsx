import React from 'react';
import { motion } from 'framer-motion';
import { EditableText, EditableList } from './EditableElements';
import { ShieldAlert, AlertCircle } from 'lucide-react';

export const Problem = () => {
  return (
    <section className="py-24 bg-slate-900 border-t border-slate-800 relative">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl relative z-10">
        
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-8 shadow-[0_0_30px_rgba(239,68,68,0.15)] border border-red-500/20"
          >
            <ShieldAlert size={32} />
          </motion.div>
          
          <EditableText 
            path="problem.headline" 
            tag="h2" 
            className="text-3xl md:text-5xl font-extrabold text-white mb-8 tracking-tight"
          />
          
          <div className="space-y-4 text-xl md:text-2xl text-slate-300 font-light max-w-2xl mx-auto">
            <EditableList
              path="problem.intro"
              renderItem={(text) => (
                <p>{text}</p>
              )}
            />
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-12 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 p-8 rounded-2xl shadow-xl shadow-slate-950/50"
          >
            <p className="text-sm uppercase tracking-widest text-slate-400 font-bold mb-4">Satu Pertanyaan Yang Terus Mengganggu:</p>
            <EditableText 
              path="problem.highlight" 
              tag="h3" 
              className="text-2xl md:text-4xl font-bold text-emerald-400 leading-snug"
            />
          </motion.div>
        </div>

        <div className="mt-16">
          <EditableList
            path="problem.fears"
            className="space-y-4"
            renderItem={(text) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50"
              >
                <AlertCircle className="text-red-400 shrink-0 mt-1" size={24} />
                <p className="text-lg md:text-xl text-slate-300">{text}</p>
              </motion.div>
            )}
          />
        </div>

      </div>
    </section>
  );
};
