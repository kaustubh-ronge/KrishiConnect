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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://krishiconnect.com';

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How KrishiConnect Works",
    "description": "Step-by-step guide on using the KrishiConnect platform for agricultural trade.",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Register & Verify",
        "text": "Farmers, agents, and delivery partners register and undergo Aadhar verification.",
        "url": `${baseUrl}/how-it-works`
      },
      {
        "@type": "HowToStep",
        "name": "List Products or Browse",
        "text": "Users list their produce or browse the marketplace with advanced filters.",
        "url": `${baseUrl}/marketplace`
      },
      {
        "@type": "HowToStep",
        "name": "Place Secure Orders",
        "text": "Transactions are protected with atomic updates and multiple payment options.",
        "url": `${baseUrl}/how-it-works`
      },
      {
        "@type": "HowToStep",
        "name": "Fulfillment & Delivery",
        "text": "Hire verified partners with OTP-based secure delivery tracking.",
        "url": `${baseUrl}/how-it-works`
      }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I join KrishiConnect?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can register as a Farmer, Agent, or Delivery Partner. Once registered, a quick verification (including Aadhar) is done to ensure security."
        }
      },
      {
        "@type": "Question",
        "name": "How does the marketplace work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Farmers and Agents can list their produce with images and prices. Others can then browse and filter listings based on location, category, and quality."
        }
      },
      {
        "@type": "Question",
        "name": "Are transactions secure on KrishiConnect?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we use atomic transactions and offer both Online Payment and COD options to protect both buyers and sellers."
        }
      }
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "How It Works",
        "item": `${baseUrl}/how-it-works`
      }
    ]
  };

  return (
    <>
      <Schema data={howToSchema} />
      <Schema data={faqSchema} />
      <Schema data={breadcrumbSchema} />
      <HowItWorksClient />
    </>
  );
}

