'use client';

import { FeatureAuthGuard } from '@/components/auth/FeatureAuthGuard';
import { MailingListManagerLanding } from '@/components/landing-pages/MailingListManagerLanding';
import MailingListManagerContent from './components/MailingListManagerContent';
import './mailing-list-manager.css';

export default function MailingListsPage() {
  return (
    <FeatureAuthGuard
      landingPage={<MailingListManagerLanding />}
      requireAuth={true}
    >
      <MailingListManagerContent />
    </FeatureAuthGuard>
  );
}