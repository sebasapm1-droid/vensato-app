import { Sidebar } from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // Route protection - Force login if NO session exists
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
              {children}
           </div>
        </main>
      </div>
    </div>
  );
}
