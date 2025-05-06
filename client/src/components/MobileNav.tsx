import { Link, useLocation } from "wouter";
import { Home, Search, Folder, History } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around z-10">
      <Link href="/">
        <a className={`flex flex-col items-center py-2 flex-1 ${location === "/" ? "text-primary" : "text-gray-500"}`}>
          <Home size={20} />
          <span className="text-xs">Home</span>
        </a>
      </Link>
      <Link href="/search">
        <a className={`flex flex-col items-center py-2 flex-1 ${location === "/search" ? "text-primary" : "text-gray-500"}`}>
          <Search size={20} />
          <span className="text-xs">Search</span>
        </a>
      </Link>
      <Link href="/collections">
        <a className={`flex flex-col items-center py-2 flex-1 ${location.startsWith("/collections") ? "text-primary" : "text-gray-500"}`}>
          <Folder size={20} />
          <span className="text-xs">Collections</span>
        </a>
      </Link>
      <Link href="/history">
        <a className={`flex flex-col items-center py-2 flex-1 ${location === "/history" ? "text-primary" : "text-gray-500"}`}>
          <History size={20} />
          <span className="text-xs">History</span>
        </a>
      </Link>
    </div>
  );
}
