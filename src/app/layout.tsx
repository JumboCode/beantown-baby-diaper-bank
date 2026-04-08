import type { Metadata } from "next";
import { Suspense } from "react";
import { Poppins } from "next/font/google";
import { createTheme, MantineProvider, Skeleton } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { ClerkProvider } from "@clerk/nextjs";
import "@mantine/core/styles.css";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Beantown Baby Diaper Bank",
  description: "Providing diapers to families in need.",
};

const theme = createTheme({
  primaryColor: "teal",
  fontFamily: "var(--font-poppins), sans-serif",
  headings: { fontFamily: "var(--font-poppins), sans-serif" },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <MantineProvider theme={theme}>
          <ModalsProvider>
            <Suspense fallback={<Skeleton />}>
              <ClerkProvider>{children}</ClerkProvider>
            </Suspense>
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
