import { ReactNode, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1">
        <Sidebar open={!isMobile || sidebarOpen} />
        
        <main className="flex-1 p-4 md:p-6 overflow-auto pt-20 md:pt-16 pb-16 md:pb-6 ml-0 md:ml-60">
          {children}
        </main>
      </div>

      {isMobile && <MobileNav />}
    </div>
  );
}
