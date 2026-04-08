import { Suspense } from "react";
import { connection } from "next/server";
import { Skeleton } from "@mantine/core";
import SignInPageClient from "./SignInPageClient";

async function SignInPageContent() {
  await connection();
  return <SignInPageClient />;
}

export default function Page() {
  return (
    <Suspense fallback={<Skeleton height="100vh" />}>
      <SignInPageContent />
    </Suspense>
  );
}
