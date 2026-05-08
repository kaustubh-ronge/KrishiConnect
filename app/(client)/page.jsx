export const dynamic = 'force-dynamic';
import HeroServer from '@/components/HeroComponents/hero-server'
import React from 'react'

export const metadata = {
  title: "KrishiConnect Home | Direct Farm-to-Agent Marketplace",
  description: "Join KrishiConnect to connect with agents, secure transport, and sell your agricultural produce efficiently.",
  openGraph: {
    title: "KrishiConnect Home | Direct Farm-to-Agent Marketplace",
    description: "Join KrishiConnect to connect with agents, secure transport, and sell your agricultural produce efficiently.",
    url: "/",
  }
};

const Home = () => {
    return (
        <div>
            <HeroServer />
        </div>
    )
}

export default Home
