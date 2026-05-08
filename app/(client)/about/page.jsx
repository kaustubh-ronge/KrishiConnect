export const dynamic = 'force-dynamic';

import React from 'react';
import AboutClient from './_components/AboutClient';

export const metadata = {
  title: "About Us",
  description: "Learn more about KrishiConnect's mission to empower farmers and streamline the agricultural supply chain.",
  openGraph: {
    title: "About Us | KrishiConnect",
    description: "Learn more about KrishiConnect's mission to empower farmers and streamline the agricultural supply chain.",
    url: "/about",
  }
};

export default function AboutPage() {
  return <AboutClient />;
}
