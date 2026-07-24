import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Haritham Garden",
  description: "Admin dashboard for Haritham Garden",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <p className="text-sm font-medium text-gray-500">
          Haritham Garden — Admin
        </p>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
