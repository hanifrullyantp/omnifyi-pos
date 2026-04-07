import React from 'react';
import { motion } from 'framer-motion';
import { EditableText, EditableList, cn } from './EditableElements';
import { useCms } from '../context/CmsContext';
import {
  XCircle, CheckCircle2, ChevronRight, Activity, Users, Boxes,
  Smartphone, BarChart3, CloudOff, Globe, Lock, ArrowRight, Video, PlayCircle
} from 'lucide-react';

export const ProblemDetails = () => {
  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <EditableText 
            path="problemDetails.headline" 
            tag="h2" 
            className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight"
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableList
            path="problemDetails.points"
            className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6"
            renderItem={(text) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-start gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                  <XCircle className="text-slate-400" size={20} />
                </div>
                <p className="text-lg text-slate-300 pt-1 leading-relaxed font-light">{text}</p>
              </motion.div>
            )}
          />
        </div>
      </div>
    </section>
  );
};

export const Solution = () => {
  return (
    <section className="py-24 bg-slate-900 border-y border-slate-800 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white mb-8 shadow-xl shadow-emerald-500/20"
          >
            <CheckCircle2 size={32} />
          </motion.div>
          <EditableText 
            path="solution.headline" 
            tag="h2" 
            className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight"
          />
          <EditableText 
            path="solution.subheadline" 
            tag="p" 
            className="text-xl md:text-2xl text-slate-400 font-light max-w-3xl mx-auto"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <EditableList
            path="solution.benefits"
            className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            renderItem={(text, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-8 rounded-2xl hover:bg-slate-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-950/50 group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center mb-6 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 transition-colors">
                  <Activity className="text-emerald-500" size={24} />
                </div>
                <p className="text-lg text-slate-300 font-medium leading-relaxed">{text}</p>
              </motion.div>
            )}
          />
        </div>
      </div>
    </section>
  );
};

export const Transition = () => {
  return (
    <section className="py-32 bg-emerald-950 relative overflow-hidden flex items-center justify-center min-h-[50vh]">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-900"></div>
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <EditableText 
            path="transition.headline" 
            tag="h2" 
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 tracking-tight leading-tight max-w-5xl mx-auto drop-shadow-sm"
          />
        </motion.div>
      </div>
    </section>
  );
};

const iconMap: Record<string, any> = {
  'Kasir On/Offline': CloudOff,
  'Akuntansi': BarChart3,
  'Aplikasi CRM': Users,
  'Dashboard Realtime': Activity,
  'Karyawan': Lock,
  'Inventori': Boxes,
  'Analisa Bisnis': Activity,
  'Order Online': Globe,
  'Business Plan': Activity
};

export const Features = () => {
  const { data } = useCms();
  
  return (
    <section className="py-24 bg-slate-950 relative">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-20">
          <EditableText 
            path="features.headline" 
            tag="h2" 
            className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.features.items.map((item, i) => {
            const Icon = iconMap[item.title] || Activity;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-slate-700 hover:bg-slate-800/80 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="text-emerald-500" size={28} />
                </div>
                <EditableText path={`features.items.${i}.title`} tag="h3" className="text-xl font-bold text-white mb-3" />
                <EditableText path={`features.items.${i}.desc`} tag="p" className="text-slate-400 leading-relaxed" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const Steps = () => {
  return (
    <section className="py-24 bg-slate-900 border-t border-slate-800 relative">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <div className="text-center mb-16">
          <EditableText 
            path="steps.headline" 
            tag="h2" 
            className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight"
          />
          <EditableText 
            path="steps.subheadline" 
            tag="p" 
            className="text-xl text-emerald-400 font-medium"
          />
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 hidden lg:block rounded-full"></div>
          
          <EditableList
            path="steps.items"
            className="grid grid-cols-1 lg:grid-cols-5 gap-8"
            renderItem={(text, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 rounded-full bg-slate-950 border-2 border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-500 mb-6 group-hover:border-emerald-500 group-hover:text-emerald-400 group-hover:bg-slate-900 transition-colors shadow-xl">
                  {i + 1}
                </div>
                <p className="text-slate-300 font-medium text-lg px-2 group-hover:text-white transition-colors">{text}</p>
              </motion.div>
            )}
          />
        </div>
      </div>
    </section>
  );
};

export const ValueStack = () => {
  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 md:p-16 shadow-2xl relative overflow-hidden">
          {/* Decoration */}
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Activity size={200} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <EditableText 
              path="valueStack.headline" 
              tag="h2" 
              className="text-3xl md:text-4xl font-extrabold text-white mb-12 tracking-tight text-center md:text-left relative z-10"
            />
          </motion.div>

          <EditableList
            path="valueStack.items"
            className="space-y-6 relative z-10"
            renderItem={(text, i) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                  <CheckCircle2 size={18} />
                </div>
                <p className="text-xl md:text-2xl text-slate-200 font-light">{text}</p>
              </motion.div>
            )}
          />
        </div>
      </div>
    </section>
  );
};

export const Urgency = () => {
  return (
    <section className="py-24 bg-red-950/20 border-y border-red-900/30 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 text-red-500 mb-8 border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.15)]"
        >
          <Activity size={40} />
        </motion.div>
        
        <EditableText 
          path="urgency.headline" 
          tag="h2" 
          className="text-3xl md:text-5xl font-extrabold text-white mb-16 tracking-tight leading-tight"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <EditableList
            path="urgency.reasons"
            className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6"
            renderItem={(text, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex items-start gap-4 hover:border-red-900/30 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-2.5 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                <p className="text-lg text-slate-300 font-light leading-relaxed">{text}</p>
              </motion.div>
            )}
          />
        </div>
      </div>
    </section>
  );
};

export const Comparison = () => {
  const { data } = useCms();
  const c = data.comparison;

  return (
    <section className="py-24 bg-slate-900 relative">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        <div className="text-center mb-16">
          <EditableText 
            path="comparison.headline" 
            tag="h2" 
            className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight"
          />
        </div>

        <div className="overflow-x-auto pb-8">
          <div className="min-w-[800px] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="grid grid-cols-4 bg-slate-900 border-b border-slate-800">
              <div className="p-6 font-bold text-slate-400">Fitur & Kemampuan</div>
              <div className="p-6 font-bold text-slate-400 text-center border-l border-slate-800">Catatan Manual</div>
              <div className="p-6 font-bold text-slate-400 text-center border-l border-slate-800">Aplikasi Kasir Biasa</div>
              <div className="p-6 font-bold text-emerald-400 text-center border-l border-slate-800 bg-emerald-500/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                Omnifyi
              </div>
            </div>

            {/* Rows */}
            {c.criteria.map((crit, i) => (
              <div key={i} className="grid grid-cols-4 border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors group">
                <div className="p-5 text-slate-300 font-medium flex items-center">
                  <EditableText path={`comparison.criteria.${i}`} tag="span" />
                </div>
                <div className="p-5 text-slate-500 text-center border-l border-slate-800/50 flex items-center justify-center">
                  <EditableText path={`comparison.manual.${i}`} tag="span" />
                </div>
                <div className="p-5 text-slate-400 text-center border-l border-slate-800/50 flex items-center justify-center">
                  <EditableText path={`comparison.basicPos.${i}`} tag="span" />
                </div>
                <div className="p-5 text-emerald-100 text-center border-l border-slate-800/50 bg-emerald-500/[0.02] flex items-center justify-center font-medium group-hover:bg-emerald-500/[0.05] transition-colors">
                  <CheckCircle2 size={16} className="text-emerald-500 mr-2 shrink-0 hidden md:block" />
                  <EditableText path={`comparison.omnifyi.${i}`} tag="span" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
