import { Navbar } from "@/components/navbar";

export default function InnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      <Navbar />
      <main className="flex-1 p-8 bg-bg-far">{children}</main>
    </section>
  );
}
