import { Sidebar, BottomNav } from "@/components/layout/Navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D" }}>
      <Sidebar />
      <main style={{ paddingBottom: "80px" }} className="app-main">
        {children}
      </main>
      <BottomNav />
      <style>{`
        @media (min-width: 640px) {
          .app-main { padding-left: 224px; padding-bottom: 0; }
        }
      `}</style>
    </div>
  );
}
