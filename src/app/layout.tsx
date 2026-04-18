import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Poppins } from "next/font/google";
import { createTheme, MantineProvider, type MantineColorsTuple } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import "@mantine/core/styles.css";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { ClerkProvider } from "@clerk/nextjs";

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

// Brand navy: #1B3668 (banner in BBDB logo)
const brandNavy: MantineColorsTuple = [
  "#e8eef7",
  "#c5d2e9",
  "#9ab0d6",
  "#6e8ec2",
  "#4a70b0",
  "#2d579e",
  "#1b3668",
  "#162c58",
  "#112149",
  "#0d1638",
];

// Brand red: #CC2027 (BEANTOWN BABY text in logo)
const brandRed: MantineColorsTuple = [
  "#fde9ea",
  "#f9bec0",
  "#f48e92",
  "#ee5e65",
  "#e83540",
  "#d42029",
  "#cc2027",
  "#a91b22",
  "#87151a",
  "#650f13",
];

const theme = createTheme({
  primaryColor: "brand",
  primaryShade: 6,
  colors: {
    brand: brandNavy,
    brandRed: brandRed,
  },
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
        <Suspense fallback={<div></div>}>
          <ClerkProvider afterSignOutUrl="/sign-in">
            <MantineProvider theme={theme}>
              <ModalsProvider>{children}</ModalsProvider>
            </MantineProvider>
          </ClerkProvider>
        </Suspense>
      </body>
    </html>
  );
}
