import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/providers/service-worker-register";
import { SITE_URL } from "@/lib/site";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MyFerment — Field logbook for fermentation",
    template: "%s · MyFerment",
  },
  description: "Mobile-first field logbook for fertilizer ferments",
  applicationName: "MyFerment",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "MyFerment",
    url: SITE_URL,
    title: "MyFerment — Field logbook for fermentation",
    description: "Mobile-first field logbook for fertilizer ferments",
  },
  appleWebApp: {
    capable: true,
    title: "MyFerment",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#5f7a3f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Set the theme class before first paint so dark mode never flashes light.
// Kept tiny and dependency-free; the ThemeProvider takes over after hydration.
const THEME_INIT = `(function(){try{var c=localStorage.getItem('ferment:theme');var d=c==='dark'||((!c||c==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="flex min-h-full flex-col bg-surface font-sans text-ink">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
