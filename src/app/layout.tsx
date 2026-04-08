import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { MantineProvider, Skeleton } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { ClerkProvider } from "@clerk/nextjs";
import "@mantine/core/styles.css";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "Beantown Baby Diaper Bank",
  description: "Providing diapers to families in need.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();

  return (
    <html lang="en">
      <body>
        <MantineProvider>
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
