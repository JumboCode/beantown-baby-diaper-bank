import { Suspense } from "react";
import { connection } from "next/server";
import { ClerkProvider } from "@clerk/nextjs";
import { Skeleton } from "@mantine/core";

async function RequestAwareClerkProviderContent({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  return <ClerkProvider>{children}</ClerkProvider>;
}

export default function RequestAwareClerkProvider({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense fallback={fallback ?? <Skeleton height="100vh" />}>
      <RequestAwareClerkProviderContent>{children}</RequestAwareClerkProviderContent>
    </Suspense>
  );
}
