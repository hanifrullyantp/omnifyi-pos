import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="font-bold text-white">🟢 Omnifyi POS</p>
            <p className="text-sm text-gray-400 mt-2">Point of Sale untuk UMKM Indonesia</p>
          </div>
          <div className="text-sm text-gray-400 space-y-1"><p className="text-white font-medium">Produk</p><p>Fitur</p><p>Harga</p><p>Changelog</p></div>
          <div className="text-sm text-gray-400 space-y-1"><p className="text-white font-medium">Bantuan</p><p>FAQ</p><p>Kontak</p><p>WhatsApp</p></div>
          <div className="text-sm text-gray-400 space-y-1"><p className="text-white font-medium">Legal</p><p>Kebijakan Privasi</p><p>Syarat & Ketentuan</p></div>
        </div>
        <p className="mt-8 pt-6 border-t border-white/[0.06] text-sm text-gray-500">© 2025 Omnifyi POS. Dibangun dengan ❤️ untuk UMKM Indonesia</p>
      </div>
    </footer>
  );
}

