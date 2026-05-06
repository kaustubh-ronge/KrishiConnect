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
  title: "KrishiConnect | Direct Farm-to-Agent Marketplace",
  description: "Connecting farmers directly with agents and delivery partners for a transparent and efficient agricultural supply chain.",
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
