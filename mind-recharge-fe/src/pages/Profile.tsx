import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/services/userApi";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const { user, logout } = useAuth();
  const qc = useQueryClient();

  // Profile Form States
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [locale, setLocale] = useState("");

  // Password Form States
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Security Password Form States
  const [isConfigSecurity, setIsConfigSecurity] = useState(false);
  const [secMode, setSecMode] = useState<"CREATE" | "CHANGE">("CREATE");
  const [oldSecPass, setOldSecPass] = useState("");
  const [newSecPass, setNewSecPass] = useState("");

  // Lấy dữ liệu profile từ Server
  const { data, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => userApi.getMe(),
  });

  const profile = data?.data as any;
  const hasSecPass = !!profile?.securityPasswordHash || !!profile?.securityPasswordUpdatedAt || profile?.hasSecurityPassword;

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setTimezone(profile.timezone || "");
      setLocale(profile.locale || "");
      if (hasSecPass) setSecMode("CHANGE");
    }
  }, [profile, hasSecPass]);

  // Cập nhật Profile Mutation
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useMutation({
    mutationFn: () =>
      userApi.updateMe({
        displayName,
        timezone,
        locale,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Hồ sơ đã được lưu 💜");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể lưu thay đổi, thử lại nhé.");
    },
  });

  // Đổi Mật Khẩu Login Mutation
  const { mutate: changePassword, isPending: isChangingPassword } = useMutation(
    {
      mutationFn: () =>
        userApi.changePassword(user?.userId || 0, {
          oldPassword: currentPassword,
          newPassword,
        }),
      onSuccess: () => {
        toast.success("Mật khẩu đã được thay đổi an toàn 🔒");
        setIsChangingPass(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      },
      onError: (err: any) => {
        if (err?.status === 404) {
          toast.info("Tính năng đổi mật khẩu đang được cập nhật thêm từ máy chủ.");
        } else {
          toast.error(err?.message || "Mật khẩu cũ không đúng hoặc có lỗi xảy ra.");
        }
      },
    }
  );

  // Mật khẩu bảo mật Mutations
  const closeSecConfig = () => {
    setIsConfigSecurity(false);
    setOldSecPass("");
    setNewSecPass("");
  };

  const { mutate: setupSecPass, isPending: isSettingUpSec } = useMutation({
    mutationFn: () => userApi.setupSecurityPassword(newSecPass),
    onSuccess: () => {
      toast.success("Mã bảo mật đã được thiết lập 🔒");
      closeSecConfig();
    },
    onError: (err: any) => toast.error(err?.message || "Không thể tạo vòng bảo mật, hoặc bạn đã có mã rồi.")
  });

  const { mutate: changeSecPass, isPending: isChangingSec } = useMutation({
    mutationFn: () => userApi.changeSecurityPassword(oldSecPass, newSecPass),
    onSuccess: () => {
      toast.success("Mã bảo mật đã được thay đổi an toàn 🔒");
      closeSecConfig();
    },
    onError: (err: any) => toast.error(err?.message || "Mã bảo mật cũ chưa đúng.")
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return toast.error("Tên hiển thị không được để trống.");
    updateProfile();
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error("Mật khẩu mới ít nhất 8 ký tự.");
    if (newPassword !== confirmPassword) return toast.error("Xác nhận mật khẩu không khớp.");
    changePassword();
  };

  const handleConfigSecPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSecPass.length !== 4) return toast.error("Mã bảo mật phải gồm 4 số.");
    if (secMode === "CREATE") setupSecPass(); 
    else {
      if (!oldSecPass) return toast.error("Vui lòng nhập mã bảo mật cũ.");
      changeSecPass();
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center healing-gradient-bg">
        <div className="w-10 h-10 rounded-full bg-primary/20 breathing healing-glow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen healing-gradient-bg flex flex-col items-center px-6 pt-12 pb-32 overflow-y-auto">
      <div className="w-full max-w-[420px] fade-in-slow">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center text-3xl mb-3 shadow-[0_0_20px_10px_rgba(255,255,255,0.02)]">
            <span>👤</span>
          </div>
          <h1 className="text-xl font-light text-foreground">{profile?.email}</h1>
          <p className="text-xs text-muted-foreground/50 mt-1">
            Thành viên từ {new Date(profile?.createdAt || "").toLocaleDateString("vi-VN")}
          </p>
        </div>

        <div className="healing-card p-5 mb-6">
          <h2 className="text-sm font-medium mb-4 text-primary">Thông tin hồ sơ</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground/70 pl-1">Tên hiển thị</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-secondary/30 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all glow-cursor"
                placeholder="Tên của bạn"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground/70 pl-1">Múi giờ</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-secondary/30 rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground/70 pl-1">Ngôn ngữ</label>
                <input
                  type="text"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="w-full bg-secondary/30 rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile || (displayName === profile?.displayName && timezone === profile?.timezone && locale === profile?.locale)}
              className="w-full bg-primary/20 text-primary py-2.5 rounded-xl text-xs hover:bg-primary/30 transition-all btn-press mt-1 disabled:opacity-50"
            >
              {isUpdatingProfile ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </div>

        <div className="healing-card p-5 mb-8">
          <h2 className="text-sm font-medium text-primary mb-1">Bảo mật Hệ thống</h2>
          
          {!isChangingPass ? (
            <button
              onClick={() => setIsChangingPass(true)}
              className="w-full bg-secondary/30 text-foreground py-2.5 rounded-xl text-xs hover:bg-secondary/50 transition-all btn-press mt-2 mb-4 relative"
            >
              Đổi mật khẩu tài khoản
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-3 mt-3 mb-6 fade-in-slow pb-4 border-b border-border/10">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground/60 pl-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full bg-secondary/30 rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground/60 pl-1">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required minLength={8}
                  className="w-full bg-secondary/30 rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground/60 pl-1">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-secondary/30 rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>

              <div className="flex gap-2 pt-2">
                 <button
                  type="button"
                  onClick={() => setIsChangingPass(false)}
                  className="flex-1 bg-secondary/30 text-muted-foreground/70 py-2.5 rounded-xl text-xs hover:bg-secondary/50 transition-all btn-press"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 bg-primary/20 text-primary py-2.5 rounded-xl text-xs hover:bg-primary/30 transition-all btn-press disabled:opacity-50"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          )}

          <div className="pt-2 border-t border-border/10">
            <h2 className="text-sm font-medium text-primary mb-1 mt-3">Security Password (Không gian kín)</h2>
            <p className="text-[10px] text-muted-foreground/50 leading-relaxed mb-3 pr-2">
              Dùng để khóa hộp "Chưa gửi". Thiết lập 4 số PIN.
            </p>

            {!isConfigSecurity ? (
              <button
                onClick={() => setIsConfigSecurity(true)}
                className="w-full bg-secondary/30 text-foreground py-2.5 rounded-xl text-xs hover:bg-secondary/50 transition-all btn-press"
              >
                Cài đặt / Thay đổi Mã bảo mật
              </button>
            ) : (
              <div className="mt-3 fade-in-slow bg-background/50 p-4 rounded-2xl border border-secondary/50 shadow-sm">
                <div className="flex gap-4 mb-5 border-b border-border/10">
                  {!hasSecPass && (
                    <button type="button" onClick={() => setSecMode('CREATE')} className={`text-[11px] pb-2 px-1 transition-all ${secMode === 'CREATE' ? 'text-primary border-b-[1.5px] border-primary font-medium' : 'text-muted-foreground/60'}`}>Thiết lập lần đầu</button>
                  )}
                  <button type="button" onClick={() => setSecMode('CHANGE')} className={`text-[11px] pb-2 px-1 transition-all ${secMode === 'CHANGE' ? 'text-primary border-b-[1.5px] border-primary font-medium' : 'text-muted-foreground/60'}`}>{hasSecPass ? "Cập nhật mã bảo mật" : "Đổi mã mới"}</button>
                </div>
                
                <form onSubmit={handleConfigSecPass} className="space-y-4">
                  {secMode === 'CHANGE' && (
                    <div className="space-y-1 fade-in-slow">
                      <label className="text-[10px] text-muted-foreground/60 pl-1">Mã bảo mật HIỆN TẠI</label>
                      <input
                        type="password" inputMode="numeric" maxLength={4}
                        value={oldSecPass}
                        onChange={(e) => setOldSecPass(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-secondary/30 rounded-xl px-3 py-3 text-sm text-center tracking-[1em] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                      />
                    </div>
                  )}

                  <div className="space-y-1 fade-in-slow">
                    <label className="text-[10px] text-muted-foreground/60 pl-1">Mã bảo mật {secMode === 'CHANGE' ? 'MỚI' : ''} (4 số)</label>
                    <input
                      type="password" inputMode="numeric" maxLength={4}
                      value={newSecPass}
                      onChange={(e) => setNewSecPass(e.target.value.replace(/\D/g, ''))}
                      required
                      className="w-full bg-secondary/30 rounded-xl px-3 py-3 text-sm text-center tracking-[1em] font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all glow-cursor"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                     <button
                      type="button"
                      onClick={closeSecConfig}
                      className="flex-1 bg-secondary/30 text-muted-foreground/70 py-2.5 rounded-xl text-xs hover:bg-secondary/50 transition-all btn-press"
                    >
                      Huỷ
                    </button>
                    <button
                      type="submit"
                      disabled={isSettingUpSec || isChangingSec}
                      className="flex-1 bg-primary/20 text-primary py-2.5 rounded-xl text-xs hover:bg-primary/30 transition-all btn-press disabled:opacity-50"
                    >
                      Lưu cấu hình
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        <button
           onClick={logout}
           className="w-full border border-rose-900/30 text-rose-400/80 hover:bg-rose-900/10 hover:text-rose-400 py-3 rounded-xl text-sm transition-all btn-press flex justify-center items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          Đăng xuất
        </button>

        <p className="mt-8 text-xs text-muted-foreground/40 italic text-center pb-8 border-b border-transparent">
          "Lựa chọn yêu thương bản thân luôn là lựa chọn đúng"
        </p>
      </div>
    </div>
  );
};

export default Profile;
