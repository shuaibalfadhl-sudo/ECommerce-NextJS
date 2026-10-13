import StorefrontNavbar from "@/components/storefront/StorefrontNavbar";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";

export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="pageEnter" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <StorefrontNavbar />
      <div style={{ flex: 1 }}>{children}</div>
      <StorefrontFooter />
    </div>
  );
}
