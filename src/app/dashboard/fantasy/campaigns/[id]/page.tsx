'use client';

import { use } from 'react';
import { useParams } from 'next/navigation';
import CampaignDetailClient from './campaign-detail-client';

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;

  return <CampaignDetailClient campaignId={campaignId} />;
}

