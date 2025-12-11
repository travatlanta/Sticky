import Navbar from "./Navbar";
import Footer from "./Footer";
import { ChatWidget } from "./ChatWidget";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export default function Layout({ children, showFooter = true }: LayoutProps) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50/50 via-white to-yellow-50/50">
      <Navbar />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
      <ChatWidget isAuthenticated={isAuthenticated} />
    </div>
  );
}
