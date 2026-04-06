import { Sidebar } from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { AgentChat } from "@/components/AgentChat";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
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

  const isAdmin = isAdminEmail(user.email);

  return (
    <div className="flex h-screen overflow-hidden bg-vensato-base">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            <DataProvider userId={user.id}>
              {children}
            </DataProvider>
          </div>
        </main>
        <AgentChat />
      </div>
    </div>
  );
}
