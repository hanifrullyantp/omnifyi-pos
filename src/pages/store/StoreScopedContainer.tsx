import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Business } from '../../lib/db';
import { useAuthStore } from '../../lib/store';

export function StoreScopedContainer({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const storeId = params.storeId as string | undefined;
  const { currentBusiness, setBusiness } = useAuthStore();

  const business = useLiveQuery(
    () => (storeId ? db.businesses.get(storeId) : undefined),
    [storeId]
  );

  useEffect(() => {
    if (!business?.id) return;
    if (currentBusiness?.id !== business.id) setBusiness(business as Business);
  }, [business?.id, currentBusiness?.id, setBusiness, business]);

  if (!storeId) return null;
  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Memuat data gerai…</p>
      </div>
    );
  }

  return <>{children}</>;
}

