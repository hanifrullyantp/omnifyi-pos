import React from 'react';
import SettingsPage from '../../pages/SettingsPage';
import { StoreScopedContainer } from './StoreScopedContainer';

export default function StoreBusinessSettingsPage() {
  return (
    <StoreScopedContainer>
      <SettingsPage initialSection="business" />
    </StoreScopedContainer>
  );
}

