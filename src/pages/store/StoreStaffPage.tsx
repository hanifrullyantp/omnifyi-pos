import React from 'react';
import SettingsPage from '../../pages/SettingsPage';
import { StoreScopedContainer } from './StoreScopedContainer';

export default function StoreStaffPage() {
  return (
    <StoreScopedContainer>
      <SettingsPage initialSection="cashiers" />
    </StoreScopedContainer>
  );
}

