import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EditableText, EditableList, EditableImage, EditableVideo, cn } from './EditableElements';
import { useCms } from '../context/CmsContext';
import { ChevronDown, ArrowRight, Bell, X, PlayCircle } from 'lucide-react';
import { LeadFormPopup } from './LeadFormPopup';
import { useLandingIntegration } from '../context/LandingIntegrationContext';

export const SoftCta = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <section className="py-24 bg-slate-900 border-t border-slate-800 relative">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <EditableText path="softCta.headline" tag="h2" className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight" />
          <EditableText path="softCta.subheadline" tag="p" className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto" />
          
          <button onClick={() => setIsOpen(true)} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 inline-flex items-center gap-2 text-lg">
            <EditableText path="softCta.cta" tag="span" /> <ArrowRight size={20} />
          </button>
        </motion.div>
      </div>
      {isOpen && <LeadFormPopup onClose={() => setIsOpen(false)} />}
    </section>
  );
};

export const Trust = () => {
  return (
    <section className="py-24 bg-slate-950 border-t border-slate-800 relative">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none"></div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <EditableText path="trust.headline" tag="h2" className="text-3xl md:text-5xl font-extrabold text-white mb-8 tracking-tight" />
            
            <EditableList 
              path="trust.narative" 
              className="text-lg md:text-xl text-slate-300 font-light mb-12 space-y-4 max-w-3xl mx-auto"
              renderItem={(text) => <p>{text}</p>}
            />

            <div className="flex flex-wrap justify-center gap-4">
              <EditableList 
                path="trust.points" 
                className="flex flex-wrap justify-center gap-4"
                renderItem={(text) => (
                  <span className="px-4 py-2 bg-slate-800/80 border border-slate-700/50 rounded-full text-emerald-400 font-medium text-sm whitespace-nowrap">
                    {text}
                  </span>
                )}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export const Demo = () => {
  return (
    <section className="py-24 bg-slate-900 border-y border-slate-800 relative">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <EditableText path="demo.headline" tag="h2" className="text-3xl md:text-5xl font-extrabold text-white mb-12 tracking-tight" />
          
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-950/50 border border-slate-700/50 aspect-video group">
             <EditableVideo pathUrl="demo.mediaUrl" pathIsVideo="demo.isVideo" className="w-full h-full" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export const ProductExplanation = () => {
    return (
        <section className="py-24 bg-slate-950 relative">
            <div className="container mx-auto px-4 lg:px-8 max-w-4xl text-center">
                <EditableText path="productExplanation.headline" tag="h2" className="text-3xl md:text-5xl font-extrabold text-white mb-12 tracking-tight leading-tight" />
                <EditableList 
                    path="productExplanation.points"
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left"
                    renderItem={(text, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-start gap-4 hover:border-emerald-500/30 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20 mt-0.5">
                                <span className="font-bold text-sm">{i + 1}</span>
                            </div>
                            <p className="text-slate-300 font-light leading-relaxed">{text}</p>
                        </motion.div>
                    )}
                />
            </div>
        </section>
    )
}

export const FinalPush = () => {
    return (
        <section className="py-24 bg-red-950/10 relative border-t border-slate-800">
            <div className="container mx-auto px-4 lg:px-8 max-w-4xl text-center">
                <EditableText path="finalPush.headline" tag="h2" className="text-3xl md:text-5xl font-extrabold text-white mb-10 tracking-tight" />
                <EditableList 
                    path="finalPush.points"
                    className="space-y-4 text-left max-w-2xl mx-auto"
                    renderItem={(text) => (
                        <div className="flex items-start gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                            <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-2.5"></div>
                            <p className="text-slate-300 text-lg font-light leading-relaxed">{text}</p>
                        </div>
                    )}
                />
            </div>
        </section>
    )
}

export const FAQ = () => {
  const { data } = useCms();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-slate-900 border-t border-slate-800 relative">
      <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
        <div className="text-center mb-16">
          <EditableText path="faq.headline" tag="h2" className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight" />
        </div>

        <div className="space-y-4">
          {data.faq.items.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={cn("bg-slate-950 border rounded-2xl overflow-hidden transition-colors", openIndex === i ? "border-emerald-500/50" : "border-slate-800 hover:border-slate-700")}
            >
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <EditableText path={`faq.items.${i}.q`} tag="span" className={cn("text-lg font-bold pr-8 transition-colors", openIndex === i ? "text-emerald-400" : "text-white")} />
                <ChevronDown className={cn("shrink-0 text-slate-500 transition-transform duration-300", openIndex === i && "rotate-180 text-emerald-400")} />
              </button>
              
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 text-slate-400 leading-relaxed font-light">
                      <EditableText path={`faq.items.${i}.a`} tag="div" multiline />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const FinalCTA = () => {
  const { openCheckoutModal } = useLandingIntegration();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="py-32 bg-emerald-900 relative overflow-hidden flex items-center justify-center text-center border-t border-emerald-800">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.3),transparent_70%)] pointer-events-none"></div>
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <EditableText path="finalCta.headline" tag="h2" className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight" />
          <EditableText path="finalCta.subheadline" tag="p" className="text-xl md:text-2xl text-emerald-100/80 font-light mb-12 max-w-2xl mx-auto" />
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => setIsOpen(true)} className="w-full sm:w-auto px-10 py-5 bg-white text-emerald-900 hover:bg-slate-100 font-bold rounded-2xl shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2 text-lg">
              <EditableText path="finalCta.cta1" tag="span" /> <ArrowRight size={20} />
            </button>
            <button onClick={() => setIsOpen(true)} className="w-full sm:w-auto px-10 py-5 bg-emerald-950/50 hover:bg-emerald-950 border border-emerald-500/30 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-lg backdrop-blur-sm">
              <EditableText path="finalCta.cta2" tag="span" /> <PlayCircle size={20} />
            </button>
            {openCheckoutModal ? (
              <button
                type="button"
                onClick={() => openCheckoutModal()}
                className="w-full sm:w-auto px-10 py-5 bg-transparent hover:bg-white/10 border border-white/30 text-white font-bold rounded-2xl transition-all text-lg"
              >
                <EditableText path="finalCta.cta3" tag="span" />
              </button>
            ) : null}
          </div>
        </motion.div>
      </div>
      {isOpen && <LeadFormPopup onClose={() => setIsOpen(false)} />}
    </section>
  );
};

export const Footer = () => {
  const { data } = useCms();
  
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-16 relative z-10">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">O</span>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Omnifyi</span>
            </div>
            <div className="text-slate-400 space-y-2 font-light">
              <EditableText path="footer.address" tag="p" multiline />
              <EditableText path="footer.contact" tag="p" />
              <EditableText path="footer.hours" tag="p" />
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">Tautan Penting</h4>
            <ul className="space-y-4 text-slate-400 font-light">
              <li>
                <a href="#auth-login" className="hover:text-emerald-400 transition">
                  Login Aplikasi
                </a>
              </li>
              <li><a href="#" className="hover:text-emerald-400 transition">Coba Gratis</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">Dokumentasi</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">Karir</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">Sosial Media</h4>
            <EditableList 
               path="footer.social"
               className="space-y-4 text-slate-400 font-light"
               renderItem={(item: any, i) => (
                  <li key={i}><a href={item.url} className="hover:text-emerald-400 transition">{item.platform}</a></li>
               )}
            />
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-sm font-light">
          <p>&copy; {new Date().getFullYear()} Omnifyi. Semua hak cipta dilindungi.</p>
          <p>
            <EditableText path="footer.privacyUrl" tag="span" />
          </p>
        </div>
      </div>
    </footer>
  );
};
