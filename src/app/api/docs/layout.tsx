export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "white", minHeight: "100vh" }}>
        <div>{children}</div>
      </body>
    </html>
  );
}
