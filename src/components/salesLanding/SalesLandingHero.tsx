import React from 'react';
import type { LandingContent } from '../../lib/landingContent';
import { cn } from '../../utils/cn';

type FeatureMini = { title: string; desc: string };

type Props = {
  content: LandingContent;
  featureHighlights: FeatureMini[];
  onCoba: () => void;
  loginPanel: React.ReactNode;
  className?: string;
};

export function SalesLandingHero({ content, featureHighlights, onCoba, loginPanel, className }: Props) {
  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-white/[0.06]',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(15,23,42,0.9), rgba(3,7,18,0.95)),
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(45,212,191,0.25), transparent),
            linear-gradient(90deg, transparent 49%, rgba(45,212,191,0.06) 50%, transparent 51%),
            linear-gradient(0deg, transparent 49%, rgba(45,212,191,0.04) 50%, transparent 51%)
          `,
          backgroundSize: '100% 100%, 100% 100%, 48px 48px, 48px 48px',
        }}
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-5 py-10 md:py-16">
        <div className="grid lg:grid-cols-[1fr_minmax(300px,400px)] gap-10 lg:gap-12 items-start">
          <div>
            <p className="inline-flex items-center gap-2 text-teal-400 text-xs sm:text-sm font-medium tracking-wide uppercase">
              <span className="h-px w-6 bg-teal-500/80" />
              {content.hero.preHeadline}
            </p>
            <h1 className="mt-4 text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold text-white leading-[1.12] tracking-tight">
              <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                {content.hero.headline1}
              </span>{' '}
              <span className="text-teal-300">{content.hero.headline2}</span>
            </h1>
            <p className="mt-4 text-lg sm:text-xl md:text-2xl font-semibold text-teal-200/90 leading-snug">
              {content.hero.sub1} {content.hero.sub2} {content.hero.sub3}
            </p>
            <p className="mt-5 text-slate-400 max-w-xl text-sm sm:text-base leading-relaxed">{content.hero.description}</p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onCoba}
                className="px-6 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25 hover:from-teal-400 hover:to-emerald-500 transition-all"
              >
                {content.hero.ctaPrimary}
              </button>
              <a
                href="#login-card"
                className="px-6 py-3.5 rounded-xl border border-teal-500/30 text-teal-100 text-center text-base font-medium hover:bg-teal-500/10 transition-colors inline-flex items-center justify-center"
              >
                {content.hero.ctaSecondary}
              </a>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm">
              <span className="text-teal-400 font-medium">{content.hero.badge}</span>
              <span className="text-slate-500">{content.hero.badgeSub}</span>
            </div>

            <div className="mt-10 grid sm:grid-cols-3 gap-3">
              {featureHighlights.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-xl p-4 border border-teal-500/10 bg-slate-900/50 hover:border-teal-500/25 hover:bg-slate-900/80 transition-colors"
                >
                  <div className="h-1 w-8 rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 mb-3 group-hover:w-12 transition-all" />
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-24">{loginPanel}</div>
        </div>

        <div className="mt-12 rounded-2xl border border-teal-500/10 bg-slate-900/40 p-3 sm:p-4 ring-1 ring-white/[0.04]">
          {content.heroImageUrl ? (
            <img src={content.heroImageUrl} className="w-full h-52 sm:h-64 md:h-72 object-cover rounded-xl" alt="" />
          ) : (
            <div className="h-52 sm:h-64 md:h-72 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-500 text-sm border border-dashed border-slate-600/50">
              Dashboard preview
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
