import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'شبیه‌ساز جامع داروخانه استرالیا | AU Pharmacy Practice Simulator',
  description: 'شبیه‌ساز جامع آزمون‌های KAPS و OPRA، تریاژ سرپایی، نسخه‌پیچی Fred و جعبه لایتنر هوشمند',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AU Pharmacy',
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
  applicationName: 'AU Pharmacy',
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AU Pharmacy" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
