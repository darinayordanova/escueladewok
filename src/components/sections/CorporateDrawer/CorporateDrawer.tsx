'use client';

import { useTranslations } from 'next-intl';

import CorporateEnquiryForm from '@/components/sections/CorporateEnquiryForm/CorporateEnquiryForm';
import MobileDrawer from '@/components/ui/MobileDrawer/MobileDrawer';

interface CorporateDrawerProps {
  courseName: string;
}

export default function CorporateDrawer({ courseName }: CorporateDrawerProps) {
  const t = useTranslations('corporateEnquiry');

  return (
    <MobileDrawer
      triggerLabel={t('heading')}
      drawerTitle={t('heading')}
    >
      <CorporateEnquiryForm courseName={courseName} />
    </MobileDrawer>
  );
}
