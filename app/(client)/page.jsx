export const dynamic = 'force-dynamic';
import HeroServer from '@/components/HeroComponents/hero-server'
import React from 'react'
import Schema from '@/components/Schema'

export const metadata = {
  title: "Direct Farm-to-Agent Marketplace",
  description: "KrishiConnect is the leading platform connecting farmers with agents and logistics providers in India. Streamline your agricultural supply chain today.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "KrishiConnect | Direct Farm-to-Agent Marketplace",
    description: "The most trusted platform for farmers to connect with agents and logistics providers. Join the agricultural revolution today.",
    url: "/",
  }
};

const Home = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://krishiconnect.com';

    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "KrishiConnect",
      "url": baseUrl,
      "description": "Connecting farmers directly with agents and delivery partners in India.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${baseUrl}/marketplace?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };

    const localBusinessSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "KrishiConnect",
      "image": `${baseUrl}/og-image.jpg`,
      "@id": baseUrl,
      "url": baseUrl,
      "telephone": "+91-1234567890",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Agri Tech Park",
        "addressLocality": "Pune",
        "postalCode": "411001",
        "addressRegion": "Maharashtra",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 18.5204,
        "longitude": 73.8567
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday"
        ],
        "opens": "09:00",
        "closes": "18:00"
      }
    };

    return (
        <div>
            <Schema data={websiteSchema} />
            <Schema data={localBusinessSchema} />
            <HeroServer />
        </div>
    )
}


export default Home
