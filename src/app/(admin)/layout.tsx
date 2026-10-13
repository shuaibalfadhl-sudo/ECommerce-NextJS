import { Suspense } from "react";
import AdminShell from "./AdminShell";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<div />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
