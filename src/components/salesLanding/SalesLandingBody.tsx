import React from 'react';
import type { LandingContent } from '../../lib/landingContent';
import { cn } from '../../utils/cn';

type Plan = 'starter' | 'growth' | 'pro';

type Props = {
  content: LandingContent;
  onCheckout: (plan: Plan) => void;
  onOpenCheckout: () => void;
  className?: string;
};

export function SalesLandingBody({ content, onCheckout, onOpenCheckout, className }: Props) {
  return (
    <div className={cn('', className)}>
      {/* Problem — “sales” emphasis */}
      <section className="max-w-6xl mx-auto px-4 sm:px-5 py-14 md:py-20">
        <p className="text-teal-400 text-xs sm:text-sm font-semibold tracking-widest uppercase text-center">{content.painPoints.label}</p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white text-center mt-3 max-w-3xl mx-auto leading-tight">
          {content.painPoints.title}
        </h2>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {content.painPoints.cards.map((c, i) => (
            <div
              key={c.title}
              className="relative rounded-2xl p-6 border border-red-500/10 bg-gradient-to-br from-slate-900/80 to-slate-950/90 overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-red-500/80" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pain {i + 1}</span>
              <p className="text-3xl mt-2 mb-2">{c.emoji}</p>
              <p className="text-white font-bold text-lg">{c.title}</p>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Deeper narrative */}
      <section id="cara-kerja" className="bg-slate-950/80 border-y border-white/[0.05]">
        <div className="max-w-3xl mx-auto px-4 sm:px-5 py-14 md:py-20">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center">{content.deeperPain.title}</h2>
          <ul className="mt-10 space-y-5">
            {content.deeperPain.items.map((i) => (
              <li
                key={i.bold}
                className="flex gap-4 rounded-xl border border-white/[0.06] bg-slate-900/40 px-4 py-4"
              >
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
                <p className="text-slate-300 leading-relaxed">
                  <span className="font-semibold text-white">{i.bold}</span>
                  {i.rest}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="max-w-6xl mx-auto px-4 sm:px-5 py-14 md:py-20">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white text-center">{content.features.title}</h2>
        <p className="text-slate-400 text-center mt-3 max-w-2xl mx-auto">{content.features.subtitle}</p>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {content.features.cards.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-6 border border-teal-500/10 bg-slate-900/30 hover:border-teal-500/30 hover:bg-slate-900/50 transition-all"
            >
              <p className="text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">Fitur</p>
              <p className="text-white font-bold">{f.title}</p>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="harga" className="bg-gradient-to-b from-slate-950 to-[#0a1628] border-t border-teal-500/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 py-14 md:py-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white text-center">{content.pricing.title}</h2>
          <p className="text-slate-400 text-center mt-3">{content.pricing.subtitle}</p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl p-8 border border-white/10 bg-slate-900/40">
              <p className="text-slate-400 text-sm font-medium">Langganan</p>
              <p className="text-white text-3xl sm:text-4xl font-extrabold mt-2">{content.pricing.monthlyPrice}</p>
              <ul className="mt-6 space-y-2 text-sm text-slate-300">
                {content.pricing.monthlyFeatures.map((x) => (
                  <li key={x} className="flex gap-2">
                    <span className="text-teal-400">✓</span> {x}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onCheckout('starter')}
                className="mt-8 w-full py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5"
              >
                Pilih paket bulanan
              </button>
            </div>
            <div className="rounded-2xl p-8 border border-teal-400/40 bg-gradient-to-br from-teal-950/50 to-emerald-950/30 shadow-xl shadow-teal-500/10 relative overflow-hidden">
              <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider text-teal-200 bg-teal-500/20 px-2 py-1 rounded-md">
                Paling populer
              </div>
              <p className="text-teal-200/80 text-sm font-medium">Sekali bayar</p>
              <p className="text-white text-3xl sm:text-4xl font-extrabold mt-2">{content.pricing.lifetimePrice}</p>
              <ul className="mt-6 space-y-2 text-sm text-slate-200">
                {content.pricing.lifetimeFeatures.map((x) => (
                  <li key={x} className="flex gap-2">
                    <span className="text-teal-300">✓</span> {x}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onCheckout('pro')}
                className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold hover:from-teal-400 hover:to-emerald-500 shadow-lg shadow-teal-500/25"
              >
                Pilih lifetime
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-5 py-14 md:py-20">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center">{content.faq.title}</h2>
        <p className="text-slate-400 text-center mt-2">{content.faq.subtitle}</p>
        <div className="mt-10 space-y-3">
          {content.faq.items.map((it) => (
            <div key={it.q} className="rounded-xl border border-white/[0.06] bg-slate-900/30 px-5 py-4">
              <p className="text-white font-semibold">{it.q}</p>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{it.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-5 pb-16">
        <div className="max-w-4xl mx-auto rounded-3xl border border-teal-500/25 bg-gradient-to-br from-teal-950/40 via-slate-900/60 to-emerald-950/30 p-8 sm:p-12 text-center shadow-2xl shadow-teal-500/5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{content.finalCta.title}</h2>
          <p className="mt-4 text-lg text-slate-300">{content.finalCta.subtitle}</p>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">{content.finalCta.description}</p>
          <p className="mt-5 text-teal-300 font-bold">{content.finalCta.badge}</p>
          <button
            type="button"
            onClick={onOpenCheckout}
            className="mt-8 px-10 py-4 rounded-2xl text-lg font-bold bg-white text-slate-900 hover:bg-teal-50 transition-colors shadow-lg"
          >
            {content.finalCta.button}
          </button>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-4 py-10 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} {content.brandName}. {content.tagline}
      </footer>
    </div>
  );
}
