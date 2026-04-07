import React from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Problem } from './components/Problem';
import { ProblemDetails, Solution, Transition, Features, Steps, ValueStack, Urgency, Comparison } from './components/Sections';
import { SoftCta, Trust, ProductExplanation, Demo, FinalPush, FAQ, FinalCTA, Footer } from './components/Sections2';
import { AdminToolbar } from './components/AdminToolbar';
import { NotificationToast } from './components/NotificationToast';

type Props = {
  authPanel: React.ReactNode;
};

/** Konten landing panjang dari folder `sales page baru`, dengan slot kartu login POS. */
export function SalesBaruPageContent({ authPanel }: Props) {
  return (
    <>
      <Header />
      <main>
        <Hero authPanel={authPanel} />
        <Problem />
        <ProblemDetails />
        <Solution />
        <Transition />
        <Features />
        <Steps />
        <SoftCta />
        <ValueStack />
        <Urgency />
        <Trust />
        <Comparison />
        <ProductExplanation />
        <Demo />
        <FinalPush />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <AdminToolbar />
      <NotificationToast />
    </>
  );
}
