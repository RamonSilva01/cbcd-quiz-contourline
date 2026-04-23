import Link from "next/link";
import { ContourlineMark } from "@/components/brand/contourline-mark";
import { AdminSignOut } from "./_components/sign-out";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bone-100)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 md:px-10">
          <div className="flex items-center gap-6">
            <Link href="/admin">
              <ContourlineMark variant="full" tone="navy" width={140} height={32} />
            </Link>
            <nav className="hidden items-center gap-6 text-sm md:flex">
              <Link
                href="/admin"
                className="text-[var(--color-clinical-700)] hover:text-[var(--color-navy-900)]"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/leads"
                className="text-[var(--color-clinical-700)] hover:text-[var(--color-navy-900)]"
              >
                Leads
              </Link>
              <Link
                href="/admin/sorteio"
                className="text-[var(--color-clinical-700)] hover:text-[var(--color-navy-900)]"
              >
                Sorteio
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-clinical-500)]">
              CBCD 2026 · triLift
            </span>
            <AdminSignOut />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10 md:px-10">{children}</main>
    </div>
  );
}
