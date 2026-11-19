import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { SiteInfoProvider } from "@/components/site/SiteInfoProvider";
import { BUILDER_GOOGLE_FONTS_HREF } from "@/lib/builder-fonts";
import { getSiteSettings } from "@/lib/site-settings";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JH MAKER | 커스텀 굿즈 제작",
    template: "%s | JH MAKER",
  },
  description:
    "에코백, 장바구니, 파우치를 나만의 디자인으로 1개부터 제작하세요.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "JH MAKER",
    title: "JH MAKER | 커스텀 굿즈 제작",
    description:
      "에코백, 장바구니, 파우치를 나만의 디자인으로 1개부터 제작하세요.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "JH MAKER | 커스텀 굿즈 제작",
    description:
      "에코백, 장바구니, 파우치를 나만의 디자인으로 1개부터 제작하세요.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteSettings = await getSiteSettings();

  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link href={BUILDER_GOOGLE_FONTS_HREF} rel="stylesheet" />
      </head>
      <body className="flex min-h-screen flex-col bg-white text-zinc-900">
        <SiteInfoProvider value={siteSettings}>
          <AppShell>{children}</AppShell>
        </SiteInfoProvider>
      </body>
    </html>
  );
}
