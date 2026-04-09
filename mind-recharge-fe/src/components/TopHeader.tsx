import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";

const HIDDEN_PATHS = ["/login", "/trigger"];

const TopHeader = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (HIDDEN_PATHS.includes(location.pathname)) return null;
  if (!isAuthenticated) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center fade-in-slow pointer-events-none">
      <div className="w-full max-w-[480px] bg-gradient-to-b from-background/80 to-transparent pt-safe pb-4 px-6 flex items-center justify-between">
        
        <div className="flex items-center gap-2.5 pointer-events-auto mt-1">
          {/* Logo container với viền mờ ảo */}
          <div className="relative w-10 h-10 rounded-[14px] overflow-hidden flex items-center justify-center p-[1px] bg-gradient-to-br from-primary/50 to-primary/10 shadow-[0_0_15px_rgba(167,139,250,0.15)]">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
            <img 
              src="/logo.png" 
              alt="Mind Recharge" 
              className="relative w-full h-full object-cover rounded-[13px]"
            />
          </div>
          
          {/* Typographical Brand Name */}
          <div className="flex items-center tracking-tighter leading-none font-sans ml-1">
            <span className="text-[25px] font-black text-foreground drop-shadow-sm">
              Mind
            </span>
            <span 
              className="text-[25px] font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 ml-[1px]"
              style={{ paddingBottom: '2px' }}
            >
              Recharge
            </span>
          </div>
        </div>
        
        {/* Nút Thông Báo Góc Phải */}
        <div className="pointer-events-auto mt-1 flex items-center">
          <button 
            className="relative w-11 h-11 rounded-full flex items-center justify-center bg-secondary/20 text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all btn-press border border-border/5"
            aria-label="Thông báo"
          >
            <Bell size={22} strokeWidth={2.2} className="opacity-80" />
            <span className="absolute top-[11px] right-[11px] w-[8px] h-[8px] bg-rose-400 rounded-full shadow-[0_0_5px_rgba(251,113,133,0.6)] border border-background/50"></span>
          </button>
        </div>
        
      </div>
    </header>
  );
};

export default TopHeader;
