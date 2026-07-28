import type { Metadata } from "next";
import { AdminToastProvider } from "@/components/AdminToast";

export const metadata: Metadata = {
  title: "Admin Console — Haritham Garden",
  description: "Unified Admin Console for Haritham Garden",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminToastProvider>{children}</AdminToastProvider>;
}
