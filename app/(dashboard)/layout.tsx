import { Sidebar } from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DataProvider } from "@/components/providers/DataProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-vensato-base">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            <DataProvider>
              {children}
            </DataProvider>
          </div>
        </main>
      </div>
    </div>
  );
}
