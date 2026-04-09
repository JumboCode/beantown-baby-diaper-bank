import RequestAwareClerkProvider from "@/components/auth/RequestAwareClerkProvider";
import SignInPageClient from "./SignInPageClient";

export default function Page() {
  return (
    <RequestAwareClerkProvider>
      <SignInPageClient />
    </RequestAwareClerkProvider>
  );
}
