import type { Metadata } from "next";
import { MantineProvider } from "@mantine/core";
import { ClerkProvider } from "@clerk/nextjs";
import { ModalsProvider } from "@mantine/modals";
import "@mantine/core/styles.css";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "Beantown Baby Diaper Bank",
  description: "Providing diapers to families in need.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body style={{ backgroundColor: "#FFFFFF", minHeight: "100vh", padding: "2%" }}>
          <MantineProvider>
            <ModalsProvider>{children}</ModalsProvider>
          </MantineProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
