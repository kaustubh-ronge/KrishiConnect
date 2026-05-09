import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import HeaderServer from "@/components/HeaderComponent/header-server";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import GoogleTranslateManager from "@/components/GoogleTranslateManger";
import Chatbot from "@/components/Chatbot";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://krishiconnect.com'),
  title: {
    template: "%s | KrishiConnect",
    default: "KrishiConnect | Direct Farm-to-Agent Marketplace",
  },
  description: "Empowering agriculture through technology. KrishiConnect links farmers with verified agents and reliable delivery partners for a seamless supply chain.",
  keywords: ["agriculture", "farming", "B2B marketplace", "farm-to-agent", "agri-supply chain", "delivery logistics", "KrishiConnect", "India agriculture"],
  authors: [{ name: "KrishiConnect Team", url: "https://krishiconnect.com" }],
  creator: "KrishiConnect",
  publisher: "KrishiConnect",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "KrishiConnect",
    title: "KrishiConnect | Direct Farm-to-Agent Marketplace",
    description: "The most trusted platform for farmers to connect with agents and logistics providers. Join the agricultural revolution today.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "KrishiConnect - Direct Farm-to-Agent Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KrishiConnect | Direct Farm-to-Agent Marketplace",
    description: "Empowering farmers with direct market access and logistics support.",
    site: "@KrishiConnect",
    creator: "@KrishiConnect",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning
          className={inter.className}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            forcedTheme="light"
            disableTransitionOnChange
          >
            <GoogleTranslateManager />
            <HeaderServer />
            <main className="min-h-screen">{children}</main>
            <Chatbot />
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
