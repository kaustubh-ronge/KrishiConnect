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
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "KrishiConnect",
      "url": "https://krishiconnect.com",
      "description": "Connecting farmers directly with agents and delivery partners.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://krishiconnect.com/marketplace?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    };

    return (
        <div>
            <Schema data={jsonLd} />
            <HeroServer />
        </div>
    )
}

export default Home
