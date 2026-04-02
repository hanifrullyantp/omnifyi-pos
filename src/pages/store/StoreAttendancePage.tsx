import React from 'react';
import HistoryPage from '../../pages/HistoryPage';
import { StoreScopedContainer } from './StoreScopedContainer';

export default function StoreAttendancePage() {
  return (
    <StoreScopedContainer>
      <HistoryPage initialTab="absensi" />
    </StoreScopedContainer>
  );
}

