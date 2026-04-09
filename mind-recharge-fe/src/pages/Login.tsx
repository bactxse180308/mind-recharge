import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Mode = "login" | "register";

const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Chào mừng bạn quay trở lại 💜");
      } else {
        if (!displayName.trim()) {
          toast.error("Vui lòng nhập tên hiển thị");
          return;
        }
        await register(email, password, displayName, "Asia/Ho_Chi_Minh");
        toast.success("Tài khoản đã được tạo 💜");
      }
      navigate("/");
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message || "Đã có lỗi xảy ra, thử lại nhé";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen healing-gradient-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[380px] fade-in-slow">
        {/* Logo / orb */}
        <div className="mx-auto mb-10 w-16 h-16 rounded-full bg-primary/20 breathing healing-glow flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-primary/40" />
        </div>

        <h1 className="text-2xl font-light text-foreground text-center mb-1">
          Mind Recharge
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-10">
          {mode === "login" ? "Chào mừng bạn quay lại 💜" : "Bắt đầu hành trình chữa lành"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground/70 pl-1">
                Tên hiển thị
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tên của bạn"
                autoComplete="name"
                className="w-full bg-secondary/50 rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all glow-cursor"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground/70 pl-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              autoComplete="email"
              required
              className="w-full bg-secondary/50 rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all glow-cursor"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground/70 pl-1">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "Ít nhất 8 ký tự" : "••••••••"}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              required
              minLength={mode === "register" ? 8 : 1}
              className="w-full bg-secondary/50 rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all glow-cursor"
            />
          </div>

          <button
            id="submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary/20 text-primary py-3.5 rounded-2xl text-sm hover:bg-primary/30 transition-all btn-press mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Đang xử lý..."
              : mode === "login"
              ? "Đăng nhập"
              : "Tạo tài khoản"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            id="toggle-mode-btn"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-xs text-muted-foreground/50 hover:text-primary/70 transition-colors"
          >
            {mode === "login"
              ? "Chưa có tài khoản? Đăng ký"
              : "Đã có tài khoản? Đăng nhập"}
          </button>
        </div>

        <p className="mt-12 text-xs text-muted-foreground/30 italic text-center leading-relaxed">
          "Bạn đang dũng cảm chọn bản thân mỗi ngày"
        </p>
      </div>
    </div>
  );
};

export default Login;
