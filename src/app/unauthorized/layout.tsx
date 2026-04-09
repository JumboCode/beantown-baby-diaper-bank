import RequestAwareClerkProvider from "@/components/auth/RequestAwareClerkProvider";

export default function UnauthorizedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequestAwareClerkProvider>{children}</RequestAwareClerkProvider>;
}
