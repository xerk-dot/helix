import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "~/components/ui/resizable";
import { DataTable } from "~/components/data-table";
import { createCaller } from "~/server/api/root";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { columns } from "./columns";
import { db } from "~/server/db";
import { type ColumnDef } from "@tanstack/react-table";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Assistant } from "../assistant";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    return redirect("/");
  }

  const caller = createCaller({ db, session, headers: new Headers() });
  const post = await caller.post.getLatest();
  const posts = post ? [{
    ...post,
    createdAt: post.createdAt.toLocaleDateString(),
  }] : [];

  const columns: ColumnDef<typeof posts[0]>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
    },
    {
      accessorKey: "createdById",
      header: "Created By",
    },
  ];

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" session={session} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col h-screen">
          <div className="@container/main flex flex-1 flex-col h-full">
            <div className="flex flex-col flex-1">
              <ResizablePanelGroup
                direction="horizontal"
                className="h-full"
              >
                <ResizablePanel 
                  defaultSize={33} 
                  minSize={20}
                  className="bg-muted overflow-hidden"
                >
                  <div className="h-full overflow-hidden">
                    <Assistant />
                  </div>
                </ResizablePanel>
                
                <ResizableHandle />
                
                <ResizablePanel defaultSize={67} className="h-full overflow-hidden">
                  <div className="h-full overflow-y-auto">
                    <DataTable columns={columns} data={posts} />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}