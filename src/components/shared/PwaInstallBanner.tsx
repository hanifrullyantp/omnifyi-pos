import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function PwaInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() =>
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pwa-install-dismiss') === '1' : false
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (dismissed || !deferred) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto rounded-2xl border border-[#2563EB]/30 bg-white dark:bg-[#1F2937] shadow-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 text-sm">
          <p className="font-semibold text-gray-900 dark:text-white">Tambahkan ke Home Screen</p>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Pasang aplikasi seperti app native. Di Safari: Share → Add to Home Screen.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium min-h-[44px]"
            onClick={() => {
              sessionStorage.setItem('pwa-install-dismiss', '1');
              setDismissed(true);
            }}
          >
            Nanti
          </button>
          <button
            type="button"
            className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold min-h-[44px]"
            onClick={() => {
              void deferred.prompt();
              void deferred.userChoice.finally(() => setDeferred(null));
            }}
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
