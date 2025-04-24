import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "~/components/ui/resizable";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Assistant } from "../assistant";
import { DataTable } from "@/components/data-table";

// Update the sample data with longer task descriptions
const data = [
  {
    id: 1,
    task: "Implement comprehensive user authentication system with OAuth2 integration, including social login providers and two-factor authentication support for enhanced security measures.",
    type: "Technical",
    status: "In Progress",
    reviewer: "Eddie Lake"
  },
  {
    id: 2,
    task: "Design and develop responsive dashboard interface with real-time data visualization components and interactive widgets for monitoring system metrics. Ensure cross-browser compatibility and optimal performance.",
    type: "Design",
    status: "Done",
    reviewer: "Jamik Tashpulatov"
  },
  {
    id: 3,
    task: "Optimize database queries and implement caching strategy to improve application performance across high-traffic periods. Implement connection pooling and query optimization techniques for better resource utilization.",
    type: "Technical",
    status: "In Progress",
    reviewer: "Eddie Lake"
  },
  {
    id: 4,
    task: "Create comprehensive API documentation including endpoint specifications, request/response examples, and authentication requirements. Include practical examples and common use cases for third-party developers.",
    type: "Documentation",
    status: "Not Started",
    reviewer: "Assign reviewer"
  }
];

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    return redirect("/");
  }

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
                    <DataTable data={data} />
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