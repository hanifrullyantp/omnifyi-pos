import React from 'react';
import ShiftsPage from '../../pages/ShiftsPage';
import { StoreScopedContainer } from './StoreScopedContainer';

export default function StoreShiftsPage() {
  return (
    <StoreScopedContainer>
      <ShiftsPage />
    </StoreScopedContainer>
  );
}

