export const dynamic = 'force-dynamic';

import React from 'react';
import HowItWorksClient from './_components/HowItWorksClient';

export const metadata = {
  title: "How It Works",
  description: "Discover how the KrishiConnect platform seamlessly connects farmers, agents, and logistics providers step-by-step.",
  openGraph: {
    title: "How It Works | KrishiConnect",
    description: "Discover how the KrishiConnect platform seamlessly connects farmers, agents, and logistics providers step-by-step.",
    url: "/how-it-works",
  }
};

export default function HowItWorksPage() {
  return <HowItWorksClient />;
}
