import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Poppins } from "next/font/google";
import "@mantine/core/styles.css";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Beantown Baby Diaper Bank",
  description: "Providing diapers to families in need.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <Suspense fallback={<div></div>}>
          <ClerkProvider afterSignOutUrl="/sign-in">
            <Providers>{children}</Providers>
          </ClerkProvider>
        </Suspense>
      </body>
    </html>
  );
}
