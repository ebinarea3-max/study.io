'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import RecapLoading from '../../app/recap/loading';
import { RecapPresentationProps } from './RecapPresentation';

const DynamicRecapPresentation = dynamic(
  () => import('./RecapPresentation'),
  {
    loading: () => <RecapLoading />,
    ssr: false,
  }
);

export default function RecapClientWrapper(props: RecapPresentationProps) {
  return <DynamicRecapPresentation {...props} />;
}
