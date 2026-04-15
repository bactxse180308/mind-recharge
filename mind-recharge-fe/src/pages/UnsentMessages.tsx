import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, LoaderCircle, Trash2, X } from "lucide-react";
import {
  unsentMessageApi,
  type UnsentMessageResponse,
} from "@/services/unsentMessageApi";
import { userApi } from "@/services/userApi";
import { imageApi } from "@/services/imageApi";
import { toast } from "sonner";
import { SecuritySessionManager } from "@/lib/securitySession";
import ImageLightbox from "@/components/ImageLightbox";

const GUARD_SECONDS = 5;

const UnsentMessages = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [draftImageUrl, setDraftImageUrl] = useState("");
  const [draftImageKey, setDraftImageKey] = useState("");
  const [releasingId, setReleasingId] = useState<number | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState("");

  const initialToken = SecuritySessionManager.get();
  const [viewMode, setViewMode] = useState<
    "GUARD" | "LOCKED" | "TRANSITION" | "UNLOCKED"
  >("GUARD");
  const [guardSecs, setGuardSecs] = useState(GUARD_SECONDS);
  const [unlockToken, setUnlockToken] = useState<string>(initialToken || "");
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [sessionMsg, setSessionMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (viewMode === "GUARD" && guardSecs > 0) {
      const timer = setTimeout(() => setGuardSecs((s) => s - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [viewMode, guardSecs]);

  const { data: profileResponse } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => userApi.getMe(),
  });

  const profile = profileResponse?.data;
  const hasSecPass = !!profile?.hasSecurityPassword;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["unsent-messages", unlockToken],
    queryFn: () => unsentMessageApi.list(unlockToken, "ACTIVE"),
    enabled: viewMode === "UNLOCKED",
    retry: false,
  });

  useEffect(() => {
    if (isError && (error as any)?.status === 401) {
      SecuritySessionManager.clear();
      setUnlockToken("");
      setViewMode("LOCKED");
      setSessionMsg("Bạn cần nhập lại mật khẩu để tiếp tục.");
    }
  }, [isError, error]);

  useEffect(() => {
    let bgTime: number | null = null;
    const visibilityChange = () => {
      if (document.hidden) {
        bgTime = Date.now();
      } else if (bgTime && Date.now() - bgTime > 60000) {
        SecuritySessionManager.clear();
        setUnlockToken("");
        setViewMode("LOCKED");
        setSessionMsg("Đã qua lâu rồi. Bạn cần nhập lại mật khẩu để tiếp tục.");
      }
    };
    document.addEventListener("visibilitychange", visibilityChange);
    return () => document.removeEventListener("visibilitychange", visibilityChange);
  }, []);

  const messages: UnsentMessageResponse[] = data?.data ?? [];

  const { mutate: createMsg, isPending: isSending } = useMutation({
    mutationFn: (body: { content?: string; imageUrl?: string; imageKey?: string }) =>
      unsentMessageApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unsent-messages"] });
      setInput("");
      setDraftImageUrl("");
      setDraftImageKey("");
    },
    onError: () => toast.error("Không thể gửi, thử lại nhé"),
  });

  const { mutate: uploadUnsentImage, isPending: isUploadingImage } = useMutation({
    mutationFn: (file: File) => imageApi.upload(file),
    onSuccess: (res) => {
      setDraftImageUrl(res.data.imageUrl);
      setDraftImageKey(res.data.key);
      toast.success("Ảnh đã sẵn sàng để gửi.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể tải ảnh lên");
    },
  });

  const { mutate: releaseMsg } = useMutation({
    mutationFn: (id: number) => unsentMessageApi.release(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unsent-messages"] });
      toast.success("Bạn vừa buông thêm một chút");
      setReleasingId(null);
    },
    onError: () => {
      toast.error("Không thể buông bỏ, thử lại nhé");
      setReleasingId(null);
    },
  });

  const { mutate: unlock, isPending: isUnlocking } = useMutation({
    mutationFn: (pass: string) => unsentMessageApi.unlock(pass),
    onSuccess: (res) => {
      const token = res.data.unlockToken;
      const expiresIn = res.data.expiresIn || 300;
      SecuritySessionManager.set(token, expiresIn);
      setUnlockToken(token);
      setSessionMsg("");
      setViewMode("TRANSITION");
      setTimeout(() => setViewMode("UNLOCKED"), 1500);
    },
    onError: () => {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setPin("");
      inputRef.current?.focus();
    },
  });

  const send = () => {
    if ((!input.trim() && !draftImageUrl) || isSending || isUploadingImage) return;
    createMsg({
      content: input.trim() || undefined,
      imageUrl: draftImageUrl || undefined,
      imageKey: draftImageKey || undefined,
    });
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadUnsentImage(file);
    e.target.value = "";
  };

  const dissolveMessage = (id: number) => {
    setReleasingId(id);
    releaseMsg(id);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (viewMode === "GUARD") {
    return (
      <div className="min-h-screen healing-gradient-bg flex flex-col items-center justify-center px-6 relative overflow-hidden page-enter">
        <div className="absolute inset-0 bg-background/95 backdrop-blur-md" />
        <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center justify-center text-center -mt-10">
          <h1 className="text-xl font-light text-foreground/90 mb-5 tracking-wide fade-in-slow">
            Bạn phải quên người ấy, nếu không bạn sẽ hối hận đấy?
          </h1>

          <div className="h-40 flex flex-col items-center justify-center mt-2">
            {guardSecs > 0 ? (
              <div className="flex flex-col items-center fade-in-slow">
                <div className="relative w-16 h-16 flex items-center justify-center mb-4 text-primary">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="30"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="opacity-20"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="30"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="188"
                      strokeDashoffset={
                        188 - (188 * (GUARD_SECONDS - guardSecs)) / GUARD_SECONDS
                      }
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <span className="text-lg font-light">{guardSecs}</span>
                </div>
                <p className="text-[11px] text-muted-foreground/40 italic">
                  Hãy suy nghĩ thật kỹ...
                </p>
              </div>
            ) : (
              <button
                onClick={() =>
                  setViewMode(SecuritySessionManager.get() ? "UNLOCKED" : "LOCKED")
                }
                className="px-8 py-3 rounded-full border border-rose-900/30 text-rose-400 hover:bg-rose-900/10 transition-all text-sm btn-press fade-in-slow"
              >
                Mình vẫn muốn tiếp tục
              </button>
            )}
          </div>

          <button
            onClick={() => navigate("/")}
            className="absolute top-full mt-24 text-xs text-muted-foreground/50 hover:text-primary transition-colors btn-press border-b border-muted-foreground/20 pb-0.5 fade-in-slow"
          >
            Bảo vệ bản thân, trở về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === "LOCKED") {
    return (
      <div className="min-h-screen healing-gradient-bg flex flex-col items-center justify-center px-6 relative w-full h-full overflow-hidden">
        <div className="absolute inset-0 backdrop-blur-sm pointer-events-none" />

        <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center page-enter">
          <h1 className="text-[17px] font-medium text-foreground/90 mb-3 text-center leading-tight">
            Không phải ai cũng thấy được những điều này
          </h1>
          <p className="text-sm tracking-wide text-foreground/60 mb-10 text-center px-4">
            {hasSecPass
              ? sessionMsg || "Nhập mật khẩu bảo mật để tiếp tục"
              : "Bạn chưa tạo mã bảo mật. Hãy cài đặt trong Hồ sơ để mở hộp Chưa gửi."}
          </p>

          {hasSecPass ? (
            <>
              <div
                className={`flex gap-4 mb-4 ${shake ? "animate-shake" : ""}`}
                onClick={() => inputRef.current?.focus()}
              >
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                      pin.length > i
                        ? "bg-primary scale-110 shadow-[0_0_8px_rgba(167,139,250,0.6)]"
                        : "bg-primary/20 scale-100"
                    }`}
                  />
                ))}
              </div>

              <div className="h-6 mt-4">
                {shake && (
                  <p className="text-sm text-primary/80 float-up italic">
                    Mật khẩu chưa đúng, thử lại nhé
                  </p>
                )}
              </div>

              <input
                ref={inputRef}
                autoFocus
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setPin(v);
                  if (v.length === 4 && !isUnlocking) unlock(v);
                }}
                className="absolute opacity-0 -z-10 focus:outline-none"
              />
            </>
          ) : null}

          {!hasSecPass && (
            <button
              onClick={() => navigate("/profile")}
              className="mt-8 rounded-full border border-primary/30 px-5 py-2.5 text-sm text-primary hover:bg-primary/10 transition-colors btn-press"
            >
              Đi tới Hồ sơ để tạo mã bảo mật
            </button>
          )}
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
            @keyframes shake-gentle {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-4px); }
              50% { transform: translateX(4px); }
              75% { transform: translateX(-4px); }
            }
            .animate-shake {
              animation: shake-gentle 0.4s ease-in-out;
            }
          `,
          }}
        />
      </div>
    );
  }

  if (viewMode === "TRANSITION") {
    return (
      <div className="min-h-screen healing-gradient-bg flex items-center justify-center px-6">
        <p
          className="text-base text-foreground/80 float-up italic tracking-wide text-center fade-in-slow"
          style={{ animationDuration: "1.5s" }}
        >
          Hãy hít thở một chút trước khi đọc lại...
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen healing-gradient-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-primary/20 breathing healing-glow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen healing-gradient-bg flex flex-col page-enter">
      <div className="max-w-[480px] w-full mx-auto flex flex-col flex-1 px-6 pt-20 pb-28">
        <div className="mb-6">
          <h1 className="text-xl font-light text-foreground mb-1">Chưa gửi</h1>
          <p className="text-sm text-muted-foreground">
            Viết ra, nhưng không gửi đi. Đây là nơi an toàn.
          </p>
          <p className="text-xs text-primary/60 italic mt-2">
            Chạm giữ hoặc nhấn thẻ để xóa
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto mb-4">
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={`flex justify-end items-center gap-2 float-up group ${
                releasingId === msg.id ? "dissolve" : ""
              }`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <button
                onClick={() => dissolveMessage(msg.id)}
                className="opacity-40 lg:opacity-0 lg:group-hover:opacity-100 text-muted-foreground/50 hover:!text-rose-400 p-1.5 transition-all btn-press"
                title="Buông bỏ"
              >
                <Trash2 size={15} />
              </button>

              <div
                onContextMenu={(e) => {
                  e.preventDefault();
                  dissolveMessage(msg.id);
                }}
                onTouchStart={() => {
                  const timer = setTimeout(() => dissolveMessage(msg.id), 600);
                  const clear = () => {
                    clearTimeout(timer);
                    document.removeEventListener("touchend", clear);
                  };
                  document.addEventListener("touchend", clear);
                }}
                className="max-w-[80%] healing-card p-3.5 cursor-pointer transition-all duration-500 blur-[1px] hover:blur-none"
              >
                {msg.imageUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewImageUrl(
                        imageApi.buildViewUrl(msg.imageKey, msg.imageUrl) || ""
                      )
                    }
                    className="mb-3 block w-full"
                  >
                    <img
                      src={imageApi.buildViewUrl(msg.imageKey, msg.imageUrl)}
                      alt="Ảnh đính kèm chưa gửi"
                      className="max-h-72 w-full rounded-2xl object-cover"
                    />
                  </button>
                )}

                {msg.content?.trim() && (
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {msg.content}
                  </p>
                )}

                {!msg.content?.trim() && !msg.imageUrl && (
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    Tin nhan #{msg.id}
                  </p>
                )}

                <span className="text-[10px] text-muted-foreground/50 mt-1 block text-right">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            </div>
          ))}

          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground/40 italic mt-12">
              Chưa có tin nhắn nào. Viết điều bạn muốn nói...
            </p>
          )}
        </div>

        <button
          id="go-trigger-btn"
          onClick={() => navigate("/trigger")}
          className="text-xs text-muted-foreground/40 mb-3 hover:text-muted-foreground transition-colors btn-press text-left"
        >
          Mình muốn nhắn thật cho họ...
        </button>

        {draftImageUrl && (
          <div className="mb-3 rounded-3xl border border-primary/15 bg-background/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Ảnh đính kèm</span>
              <button
                type="button"
                onClick={() => {
                  setDraftImageUrl("");
                  setDraftImageKey("");
                }}
                className="rounded-full p-1 text-muted-foreground/70 transition hover:bg-secondary/40 hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>
            <img
              src={draftImageUrl}
              alt="Xem trước ảnh đính kèm"
              className="max-h-60 w-full rounded-2xl object-cover"
            />
          </div>
        )}

        <div className="flex gap-2">
          <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl bg-secondary/50 text-muted-foreground transition-all hover:bg-secondary/70 hover:text-foreground">
            {isUploadingImage ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <ImagePlus size={18} />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleImageSelected}
              disabled={isUploadingImage}
            />
          </label>

          <input
            id="unsent-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Viết những gì bạn muốn nói..."
            className="flex-1 bg-secondary/50 rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/20 glow-cursor transition-all"
          />

          {(input.trim() || draftImageUrl) && (
            <button
              id="send-unsent-btn"
              onClick={send}
              disabled={isSending || isUploadingImage}
              className="bg-primary/20 text-primary px-4 rounded-2xl text-sm hover:bg-primary/30 transition-all btn-press disabled:opacity-50"
            >
              {isSending ? "..." : "Gửi"}
            </button>
          )}
        </div>
      </div>

      <ImageLightbox
        open={!!previewImageUrl}
        imageUrl={previewImageUrl}
        alt="Ảnh đính kèm chưa gửi"
        onClose={() => setPreviewImageUrl("")}
      />
    </div>
  );
};

export default UnsentMessages;
