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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    template: "%s | KrishiConnect",
    default: "KrishiConnect | Direct Farm-to-Agent Marketplace",
  },
  description: "Connecting farmers directly with agents and delivery partners for a transparent and efficient agricultural supply chain.",
  keywords: ["agriculture", "farming", "B2B marketplace", "farm-to-agent", "agri-supply chain", "delivery", "KrishiConnect"],
  authors: [{ name: "KrishiConnect Team" }],
  creator: "KrishiConnect",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "KrishiConnect",
    title: "KrishiConnect | Direct Farm-to-Agent Marketplace",
    description: "Connecting farmers directly with agents and delivery partners for a transparent and efficient agricultural supply chain.",
    images: [
      {
        url: "/og-image.jpg", // Needs to be generated or placed in public
        width: 1200,
        height: 630,
        alt: "KrishiConnect Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KrishiConnect | Direct Farm-to-Agent Marketplace",
    description: "Connecting farmers directly with agents and delivery partners for a transparent and efficient agricultural supply chain.",
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
