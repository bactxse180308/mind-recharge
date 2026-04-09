import { useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, MessageCircle, Compass, Heart, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const tabs = [
  { path: "/", icon: Home, label: "Trang chủ" },
  { path: "/journal", icon: BookOpen, label: "Nhật ký" },
  { path: "/unsent", icon: MessageCircle, label: "Chưa gửi" },
  { path: "/tracker", icon: Compass, label: "Hành trình" },
  { path: "/tasks", icon: Heart, label: "Điều nhỏ" },
  { path: "/profile", icon: User, label: "Hồ sơ" },
];

const HIDDEN_PATHS = ["/trigger", "/login"];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  if (HIDDEN_PATHS.includes(location.pathname)) return null;
  if (!isAuthenticated) return null;

  const handleLogout = async () => {
    await logout();
    toast.success("Hẹn gặp lại bạn 💜");
    navigate("/login");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div className="w-full max-w-[480px] border-t border-border/20 bg-card/70 backdrop-blur-2xl px-2 pb-safe">
        <div className="flex justify-around py-2">
          {tabs.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                id={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 btn-press ${
                  active
                    ? "text-primary nav-glow"
                    : "text-muted-foreground/40 hover:text-muted-foreground/70"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 1.8 : 1.3} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
