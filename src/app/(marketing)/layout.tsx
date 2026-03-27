import React from 'react';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F19] to-[#0D1B2A] text-white overflow-x-hidden">
      {children}
    </div>
  );
}

