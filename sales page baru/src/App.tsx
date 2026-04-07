import React from 'react';
import { CmsProvider } from './context/CmsContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Problem } from './components/Problem';
import { ProblemDetails, Solution, Transition, Features, Steps, ValueStack, Urgency, Comparison } from './components/Sections';
import { SoftCta, Trust, ProductExplanation, Demo, FinalPush, FAQ, FinalCTA, Footer } from './components/Sections2';
import { AdminToolbar } from './components/AdminToolbar';
import { NotificationToast } from './components/NotificationToast';

function AppContent() {
  return (
    <div className="bg-slate-950 min-h-screen text-slate-50 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 scroll-smooth">
      <Header />
      
      <main>
        <Hero />
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
    </div>
  );
}

function App() {
  return (
    <CmsProvider>
      <AppContent />
    </CmsProvider>
  );
}

export default App;
