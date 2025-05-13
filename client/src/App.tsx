import { Route, Switch, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppProvider } from "@/context/AppContext";
import Home from "@/pages/Home";
import Downloads from "@/pages/Downloads";
import Library from "@/pages/Library";
import History from "@/pages/History";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

function Router() {
  const [location] = useLocation();
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentPath={location} />
        <main className="flex-1 flex flex-col overflow-y-auto bg-background mac-scrollbar">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/downloads" component={Downloads} />
            <Route path="/library" component={Library} />
            <Route path="/history" component={History} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <Toaster />
          <Router />
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
