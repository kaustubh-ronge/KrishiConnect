export const dynamic = 'force-dynamic';
import React from 'react';
import AboutClient from './_components/AboutClient';
import Schema from '@/components/Schema';

export const metadata = {
  title: "About Us",
  description: "Learn about KrishiConnect's mission to bridge the gap between farmers and markets using innovative technology and logistics solutions.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us | KrishiConnect",
    description: "Empowering farmers and streamlining the agricultural supply chain across India.",
    url: "/about",
  }
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About KrishiConnect",
    "description": "Information about KrishiConnect and its mission to help farmers.",
    "publisher": {
      "@type": "Organization",
      "name": "KrishiConnect",
      "logo": "https://krishiconnect.com/logo.png"
    }
  };

  return (
    <>
      <Schema data={jsonLd} />
      <AboutClient />
    </>
  );
}
