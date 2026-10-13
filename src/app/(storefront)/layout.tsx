import StorefrontNavbar from "@/components/storefront/StorefrontNavbar";

export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <StorefrontNavbar />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
