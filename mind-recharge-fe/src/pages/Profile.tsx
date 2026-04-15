import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, ChevronRight, LoaderCircle, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { userApi } from "@/services/userApi";
import { imageApi } from "@/services/imageApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ImageLightbox from "@/components/ImageLightbox";
import {
  CROP_SIZE,
  type CropDraft,
  createCroppedFile,
  getCoverMetrics,
  loadImage,
} from "@/lib/avatarCrop";

// TODO: replace with real API data
const mockFriendCount = 3;
const mockRequestCount = 1;

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [locale, setLocale] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarKey, setAvatarKey] = useState("");
  const [cropDraft, setCropDraft] = useState<CropDraft | null>(null);
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);

  const [isChangingPass, setIsChangingPass] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isConfigSecurity, setIsConfigSecurity] = useState(false);
  const [secMode, setSecMode] = useState<"CREATE" | "CHANGE">("CREATE");
  const [oldSecPass, setOldSecPass] = useState("");
  const [newSecPass, setNewSecPass] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => userApi.getMe(),
  });

  const profile = data?.data as any;
  const avatarSrc = imageApi.buildViewUrl(
    avatarKey || profile?.avatarKey,
    avatarUrl || profile?.avatarUrl
  );
  const hasSecPass =
    !!profile?.securityPasswordHash ||
    !!profile?.securityPasswordUpdatedAt ||
    profile?.hasSecurityPassword;

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName || "");
    setTimezone(profile.timezone || "");
    setLocale(profile.locale || "");
    setAvatarUrl(profile.avatarUrl || "");
    setAvatarKey(profile.avatarKey || "");
    if (hasSecPass) setSecMode("CHANGE");
  }, [profile, hasSecPass]);

  const closeCropDraft = () => {
    if (cropDraft?.imageUrl) {
      URL.revokeObjectURL(cropDraft.imageUrl);
    }
    setCropDraft(null);
  };

  const { mutate: updateProfile, isPending: isUpdatingProfile } = useMutation({
    mutationFn: async () => {
      const previousAvatarKey = profile?.avatarKey || "";
      const result = await userApi.updateMe({
        displayName,
        timezone,
        locale,
        avatarUrl,
        avatarKey,
      });

      if (previousAvatarKey && previousAvatarKey !== avatarKey) {
        try {
          await imageApi.delete(previousAvatarKey);
        } catch (error) {
          console.error(error);
          toast.error("Hồ sơ đã lưu, nhưng chưa xóa được ảnh cũ trên R2.");
        }
      }

      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Hồ sơ đã được lưu");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể lưu thay đổi");
    },
  });

  const { mutate: deleteAvatar, isPending: isDeletingAvatar } = useMutation({
    mutationFn: async () => {
      const currentKey = avatarKey || profile?.avatarKey || "";
      await userApi.updateMe({
        avatarUrl: "",
        avatarKey: "",
      });
      if (currentKey) {
        await imageApi.delete(currentKey);
      }
    },
    onSuccess: () => {
      setAvatarUrl("");
      setAvatarKey("");
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Đã xóa ảnh đại diện");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể xóa ảnh đại diện");
    },
  });

  const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useMutation({
    mutationFn: async (file: File) => {
      const previousAvatarKey = avatarKey || profile?.avatarKey || "";
      const uploadRes = await imageApi.upload(file);
      const nextAvatarUrl = uploadRes.data.imageUrl;
      const nextAvatarKey = uploadRes.data.key;

      try {
        await userApi.updateMe({
          avatarUrl: nextAvatarUrl,
          avatarKey: nextAvatarKey,
        });

        if (previousAvatarKey && previousAvatarKey !== nextAvatarKey) {
          try {
            await imageApi.delete(previousAvatarKey);
          } catch (error) {
            console.error(error);
            toast.error("Avatar đã cập nhật, nhưng chưa xóa được ảnh cũ trên R2.");
          }
        }

        return {
          avatarUrl: nextAvatarUrl,
          avatarKey: nextAvatarKey,
        };
      } catch (error) {
        try {
          await imageApi.delete(nextAvatarKey);
        } catch (cleanupError) {
          console.error(cleanupError);
        }
        throw error;
      }
    },
    onSuccess: ({ avatarUrl: nextAvatarUrl, avatarKey: nextAvatarKey }) => {
      setAvatarUrl(nextAvatarUrl);
      setAvatarKey(nextAvatarKey);
      closeCropDraft();
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Ảnh đại diện đã được cập nhật.");
      return;
      toast.success("Ảnh đại diện đã tải lên. Nhấn lưu để cập nhật.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể cập nhật ảnh đại diện");
      return;
      toast.error(err?.message || "Không thể tải ảnh lên");
    },
  });

  const { mutate: changePassword, isPending: isChangingPassword } = useMutation({
    mutationFn: () =>
      userApi.changePassword(user?.userId || 0, {
        oldPassword: currentPassword,
        newPassword,
      }),
    onSuccess: () => {
      toast.success("Mật khẩu đã được thay đổi");
      setIsChangingPass(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => {
      if (err?.status === 404) {
        toast.info("Tính năng đổi mật khẩu đang được cập nhật thêm từ máy chủ.");
      } else {
        toast.error(err?.message || "Không thể đổi mật khẩu");
      }
    },
  });

  const closeSecConfig = () => {
    setIsConfigSecurity(false);
    setOldSecPass("");
    setNewSecPass("");
  };

  const { mutate: setupSecPass, isPending: isSettingUpSec } = useMutation({
    mutationFn: () => userApi.setupSecurityPassword(newSecPass),
    onSuccess: () => {
      toast.success("Mã bảo mật đã được thiết lập");
      closeSecConfig();
    },
    onError: (err: any) =>
      toast.error(err?.message || "Không thể tạo mã bảo mật"),
  });

  const { mutate: changeSecPass, isPending: isChangingSec } = useMutation({
    mutationFn: () => userApi.changeSecurityPassword(oldSecPass, newSecPass),
    onSuccess: () => {
      toast.success("Mã bảo mật đã được thay đổi");
      closeSecConfig();
    },
    onError: (err: any) =>
      toast.error(err?.message || "Mã bảo mật cũ chưa đúng"),
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Tên hiển thị không được để trống");
      return;
    }
    updateProfile();
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Mật khẩu mới ít nhất 8 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Xác nhận mật khẩu không khớp");
      return;
    }
    changePassword();
  };

  const handleConfigSecPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSecPass.length !== 4) {
      toast.error("Mã bảo mật phải gồm 4 số");
      return;
    }
    if (secMode === "CREATE") {
      setupSecPass();
      return;
    }
    if (!oldSecPass) {
      toast.error("Vui lòng nhập mã bảo mật cũ");
      return;
    }
    changeSecPass();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = URL.createObjectURL(file);
      const image = await loadImage(imageUrl);
      setCropDraft((prev) => {
        if (prev?.imageUrl) URL.revokeObjectURL(prev.imageUrl);
        return {
          file,
          previewUrl: imageUrl,
          imageUrl,
          zoom: 1,
          offsetX: 0,
          offsetY: 0,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
        };
      });
    } catch (error) {
      console.error(error);
      toast.error("Không thể đọc ảnh để cắt.");
    } finally {
      e.target.value = "";
    }
  };

  const cropMetrics = useMemo(() => {
    if (!cropDraft) return null;
    return getCoverMetrics(
      cropDraft.naturalWidth,
      cropDraft.naturalHeight,
      cropDraft.zoom,
      cropDraft.offsetX,
      cropDraft.offsetY
    );
  }, [cropDraft]);

  const confirmCropAndUpload = async () => {
    if (!cropDraft) return;
    try {
      const croppedFile = await createCroppedFile({
        ...cropDraft,
        offsetX: cropMetrics?.offsetX ?? cropDraft.offsetX,
        offsetY: cropMetrics?.offsetY ?? cropDraft.offsetY,
      });
      uploadAvatar(croppedFile);
    } catch (error) {
      console.error(error);
      toast.error("Không thể cắt ảnh");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center healing-gradient-bg">
        <div className="w-10 h-10 rounded-full bg-primary/20 breathing healing-glow" />
      </div>
    );
  }

  const profileUnchanged =
    displayName === profile?.displayName &&
    timezone === profile?.timezone &&
    locale === profile?.locale &&
    avatarUrl === (profile?.avatarUrl || "") &&
    avatarKey === (profile?.avatarKey || "");

  return (
    <>
      <div className="min-h-screen healing-gradient-bg flex flex-col items-center px-6 pt-20 pb-32 overflow-y-auto">
        <div className="w-full max-w-[420px] fade-in-slow">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="relative mb-3">
            <button
              type="button"
              onClick={() => avatarSrc && setIsAvatarPreviewOpen(true)}
              className="rounded-full"
              disabled={!avatarSrc}
            >
              <Avatar className="h-24 w-24 border border-primary/20 shadow-[0_0_24px_6px_rgba(255,255,255,0.03)]">
              <AvatarImage
                src={avatarSrc || undefined}
                alt={profile?.displayName || profile?.email || "Ảnh đại diện"}
                className="object-cover"
              />
                <AvatarFallback className="bg-primary/15 text-3xl text-primary">
                  {(displayName || profile?.email || "U")
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>

            <label className="absolute -right-1 -bottom-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-primary/25 bg-background/90 text-primary shadow-lg transition-all hover:bg-primary/10">
              {isUploadingAvatar ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Camera size={16} />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar || isDeletingAvatar}
              />
            </label>
          </div>

          <div className="mb-4 flex gap-2">
            <label className="cursor-pointer rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs text-primary transition hover:bg-primary/20">
              Đổi ảnh đại diện
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar || isDeletingAvatar}
              />
            </label>
            {(avatarUrl || profile?.avatarUrl) && (
              <button
                type="button"
                onClick={() => deleteAvatar()}
                disabled={isDeletingAvatar || isUploadingAvatar}
                className="inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-500/10 px-4 py-2 text-xs text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
              >
                {isDeletingAvatar ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Xóa ảnh đại diện
              </button>
            )}
          </div>

          <h1 className="text-xl font-light text-foreground">{profile?.email}</h1>
          <p className="text-xs text-muted-foreground/50 mt-1">
            Thành viên từ{" "}
            {new Date(profile?.createdAt || "").toLocaleDateString("vi-VN")}
          </p>
        </div>

        {/* Friends entry widget */}
        <button
          onClick={() => navigate("/friends")}
          className="w-full healing-card p-4 mb-6 flex items-center gap-4 hover:bg-card/80 transition-colors duration-300 btn-press text-left"
        >
          <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Users size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Bạn bè</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              {mockFriendCount} bạn bè · {mockRequestCount} lời mời
            </p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground/40 flex-shrink-0" />
        </button>

        <div className="healing-card p-5 mb-6">
          <h2 className="text-sm font-medium mb-4 text-primary">Thông tin hồ sơ</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground/70 pl-1">
                Tên hiển thị
              </label>
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
                <label className="text-xs text-muted-foreground/70 pl-1">
                  Múi giờ
                </label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-secondary/30 rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground/70 pl-1">
                  Ngôn ngữ
                </label>
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
              disabled={isUpdatingProfile || isUploadingAvatar || isDeletingAvatar || profileUnchanged}
              className="w-full bg-primary/20 text-primary py-2.5 rounded-xl text-xs hover:bg-primary/30 transition-all btn-press mt-1 disabled:opacity-50"
            >
              {isUpdatingProfile ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </div>

        <div className="healing-card p-5 mb-8">
          <h2 className="text-sm font-medium text-primary mb-1">Bảo mật hệ thống</h2>

          {!isChangingPass ? (
            <button
              onClick={() => setIsChangingPass(true)}
              className="w-full bg-secondary/30 text-foreground py-2.5 rounded-xl text-xs hover:bg-secondary/50 transition-all btn-press mt-2 mb-4 relative"
            >
              Đổi mật khẩu tài khoản
            </button>
          ) : (
            <form
              onSubmit={handleChangePassword}
              className="space-y-3 mt-3 mb-6 fade-in-slow pb-4 border-b border-border/10"
            >
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground/60 pl-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full bg-secondary/30 rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground/60 pl-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-secondary/30 rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground/60 pl-1">
                  Xác nhận mật khẩu
                </label>
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
                  Hủy
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
            <h2 className="text-sm font-medium text-primary mb-1 mt-3">
              Mã bảo mật
            </h2>
            <p className="text-[10px] text-muted-foreground/50 leading-relaxed mb-3 pr-2">
              Dùng để khóa hộp Chưa gửi. Thiết lập PIN 4 số.
            </p>

            {!isConfigSecurity ? (
              <button
                onClick={() => setIsConfigSecurity(true)}
                className="w-full bg-secondary/30 text-foreground py-2.5 rounded-xl text-xs hover:bg-secondary/50 transition-all btn-press"
              >
                Cài đặt / Thay đổi mã bảo mật
              </button>
            ) : (
              <div className="mt-3 fade-in-slow bg-background/50 p-4 rounded-2xl border border-secondary/50 shadow-sm">
                <div className="flex gap-4 mb-5 border-b border-border/10">
                  {!hasSecPass && (
                    <button
                      type="button"
                      onClick={() => setSecMode("CREATE")}
                      className={`text-[11px] pb-2 px-1 transition-all ${
                        secMode === "CREATE"
                          ? "text-primary border-b-[1.5px] border-primary font-medium"
                          : "text-muted-foreground/60"
                      }`}
                    >
                      Thiết lập lần đầu
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSecMode("CHANGE")}
                    className={`text-[11px] pb-2 px-1 transition-all ${
                      secMode === "CHANGE"
                        ? "text-primary border-b-[1.5px] border-primary font-medium"
                        : "text-muted-foreground/60"
                    }`}
                  >
                    {hasSecPass ? "Cập nhật mã bảo mật" : "Đổi mã mới"}
                  </button>
                </div>

                <form onSubmit={handleConfigSecPass} className="space-y-4">
                  {secMode === "CHANGE" && (
                    <div className="space-y-1 fade-in-slow">
                      <label className="text-[10px] text-muted-foreground/60 pl-1">
                        Mã bảo mật hiện tại
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={oldSecPass}
                        onChange={(e) =>
                          setOldSecPass(e.target.value.replace(/\D/g, ""))
                        }
                        className="w-full bg-secondary/30 rounded-xl px-3 py-3 text-sm text-center tracking-[1em] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                      />
                    </div>
                  )}

                  <div className="space-y-1 fade-in-slow">
                    <label className="text-[10px] text-muted-foreground/60 pl-1">
                      Mã bảo mật {secMode === "CHANGE" ? "mới" : ""} (4 số)
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={newSecPass}
                      onChange={(e) =>
                        setNewSecPass(e.target.value.replace(/\D/g, ""))
                      }
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
                      Hủy
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          Đăng xuất
        </button>

        <p className="mt-8 text-xs text-muted-foreground/40 italic text-center pb-8 border-b border-transparent">
          Lựa chọn yêu thương bản thân luôn là lựa chọn đúng
        </p>
        </div>
      </div>

      {cropDraft && cropMetrics && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 px-4 backdrop-blur-md">
          <div className="w-full max-w-[420px] rounded-[28px] border border-border/20 bg-background/95 p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-base text-foreground">Căn chỉnh ảnh đại diện</h2>
                <p className="text-xs text-muted-foreground">
                  Căn chỉnh khung vuông trước khi tải lên.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCropDraft}
                className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary/40 hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-5 flex justify-center">
              <div className="relative h-[280px] w-[280px] overflow-hidden rounded-[32px] bg-secondary/20">
                <img
                  src={cropDraft.previewUrl}
                  alt="Xem trước ảnh cắt"
                  draggable={false}
                  className="absolute left-0 top-0 select-none"
                  style={{
                    width: `${cropMetrics.displayWidth}px`,
                    height: `${cropMetrics.displayHeight}px`,
                    transform: `translate(${(CROP_SIZE - cropMetrics.displayWidth) / 2 + cropMetrics.offsetX}px, ${(CROP_SIZE - cropMetrics.displayHeight) / 2 + cropMetrics.offsetY}px)`,
                    transformOrigin: "top left",
                    maxWidth: "none",
                  }}
                />
                <div className="pointer-events-none absolute inset-0 rounded-[32px] ring-1 ring-white/40" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Phóng to</span>
                  <span>{cropDraft.zoom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={cropDraft.zoom}
                  onChange={(e) =>
                    setCropDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            zoom: Number(e.target.value),
                          }
                        : prev
                    )
                  }
                  className="w-full"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Dịch ngang</span>
                  <span>{Math.round(cropMetrics.offsetX)} px</span>
                </div>
                <input
                  type="range"
                  min={-Math.max(0, (cropMetrics.displayWidth - CROP_SIZE) / 2)}
                  max={Math.max(0, (cropMetrics.displayWidth - CROP_SIZE) / 2)}
                  step={1}
                  value={cropMetrics.offsetX}
                  onChange={(e) =>
                    setCropDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            offsetX: Number(e.target.value),
                          }
                        : prev
                    )
                  }
                  className="w-full"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Dịch dọc</span>
                  <span>{Math.round(cropMetrics.offsetY)} px</span>
                </div>
                <input
                  type="range"
                  min={-Math.max(0, (cropMetrics.displayHeight - CROP_SIZE) / 2)}
                  max={Math.max(0, (cropMetrics.displayHeight - CROP_SIZE) / 2)}
                  step={1}
                  value={cropMetrics.offsetY}
                  onChange={(e) =>
                    setCropDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            offsetY: Number(e.target.value),
                          }
                        : prev
                    )
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={closeCropDraft}
                className="flex-1 rounded-2xl bg-secondary/40 py-3 text-sm text-foreground transition hover:bg-secondary/60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmCropAndUpload}
                disabled={isUploadingAvatar}
                className="flex-1 rounded-2xl bg-primary/20 py-3 text-sm text-primary transition hover:bg-primary/30 disabled:opacity-50"
              >
                {isUploadingAvatar ? "Đang tải..." : "Cắt và tải lên"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ImageLightbox
        open={isAvatarPreviewOpen}
        imageUrl={avatarSrc || undefined}
        alt={profile?.displayName || profile?.email || "Ảnh đại diện"}
        onClose={() => setIsAvatarPreviewOpen(false)}
      />
    </>
  );
};

export default Profile;
