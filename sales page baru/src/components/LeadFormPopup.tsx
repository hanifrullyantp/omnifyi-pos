import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';

interface LeadFormPopupProps {
  onClose: () => void;
}

export const LeadFormPopup: React.FC<LeadFormPopupProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    city: '',
    needs: '',
    size: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submit
    alert(`Terima kasih ${formData.name}. Tim kami akan segera menghubungi Anda.`);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
          
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Mulai Gunakan Omnifyi</h2>
            <p className="text-slate-400">Isi form di bawah ini dan tim kami akan menghubungi Anda untuk demo gratis.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nama Lengkap *</label>
              <input 
                required
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">No. WhatsApp *</label>
                <input 
                  required
                  type="tel" 
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Kota *</label>
                <input 
                  required
                  type="text" 
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Jenis Usaha *</label>
              <select 
                required
                name="needs"
                value={formData.needs}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition appearance-none"
              >
                <option value="" disabled>Pilih Jenis Usaha</option>
                <option value="F&B">F&B (Kafe, Resto, Kedai)</option>
                <option value="Retail">Retail & Kelontong</option>
                <option value="Jasa">Jasa & Salon</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Jumlah Outlet Saat Ini (Opsional)</label>
              <select 
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition appearance-none"
              >
                <option value="">Pilih Skala Usaha</option>
                <option value="1">1 Outlet</option>
                <option value="2-5">2 - 5 Outlet</option>
                <option value=">5">Lebih dari 5 Outlet</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Catatan (Opsional)</label>
              <textarea 
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition resize-none"
                placeholder="Ada kebutuhan spesifik yang ingin ditanyakan?"
              ></textarea>
            </div>
            
            <button 
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-lg shadow-lg transition-all flex justify-center items-center gap-2 mt-4"
            >
              Minta Demo Gratis <Send size={18} />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
