export const dynamic = 'force-dynamic';
import React from 'react';
import HowItWorksClient from './_components/HowItWorksClient';
import Schema from '@/components/Schema';

export const metadata = {
  title: "How It Works",
  description: "Explore the step-by-step process of how KrishiConnect facilitates direct trade between farmers and agents with integrated logistics.",
  alternates: {
    canonical: "/how-it-works",
  },
  openGraph: {
    title: "How It Works | KrishiConnect",
    description: "Discover our seamless agricultural supply chain process.",
    url: "/how-it-works",
  }
};

export default function HowItWorksPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How KrishiConnect Works",
    "description": "Step-by-step guide on using the KrishiConnect platform for agricultural trade.",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Register",
        "text": "Farmers and agents register on the platform."
      },
      {
        "@type": "HowToStep",
        "name": "List Products",
        "text": "Farmers list their produce in the marketplace."
      },
      {
        "@type": "HowToStep",
        "name": "Connect",
        "text": "Agents browse listings and connect with farmers."
      }
    ]
  };

  return (
    <>
      <Schema data={jsonLd} />
      <HowItWorksClient />
    </>
  );
}
