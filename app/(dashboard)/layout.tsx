export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-vensato-base">
      {/* Sidebar Placeholder */}
      <aside className="w-64 bg-vensato-surface shadow-sm hidden lg:block">
        <div className="p-6">
          <h1 className="font-heading font-bold text-2xl text-vensato-text-main">
            Vensato
          </h1>
        </div>
        <nav className="px-4 py-2">
          {/* Navigation Links Placeholder */}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header Placeholder */}
        <header className="h-16 bg-vensato-surface shadow-sm sticky top-0 z-10 flex items-center px-8">
          <h2 className="font-heading font-bold text-xl">Dashboard</h2>
        </header>
        
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
