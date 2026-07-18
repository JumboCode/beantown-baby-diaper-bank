import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
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
  title: "Beantown Baby Diaper Bank Impact Visualization",
  description: "Visualizing the impact of the Beantown Baby Diaper Bank across Greater Boston.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

async function DynamicShell({ children }: { children: React.ReactNode }) {
  await connection();
  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <Suspense fallback={<div></div>}>
          <DynamicShell>
            <ClerkProvider afterSignOutUrl="/sign-in">
              <Providers>{children}</Providers>
            </ClerkProvider>
          </DynamicShell>
        </Suspense>
      </body>
    </html>
  );
}
