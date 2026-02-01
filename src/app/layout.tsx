import type { Metadata } from "next";
import { MantineProvider } from "@mantine/core";
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
    <html lang="en">
      <body>
        <MantineProvider>
          <ModalsProvider>{children}</ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
