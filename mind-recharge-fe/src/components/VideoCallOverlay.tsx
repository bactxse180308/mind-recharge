import { useEffect, useRef } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { imageApi } from "@/services/imageApi";
import type { CallSession } from "@/types/call";

interface VideoCallOverlayProps {
  incomingCall: CallSession | null;
  activeCall: CallSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMicMuted: boolean;
  isCameraEnabled: boolean;
  onAcceptIncomingCall: () => void;
  onRejectIncomingCall: () => void;
  onEndCall: () => void;
  onToggleMicrophone: () => void;
  onToggleCamera: () => void;
}

function getInitial(value?: string) {
  return (value || "U").trim().charAt(0).toUpperCase();
}

function StreamVideo({
  stream,
  muted = false,
  className,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={className}
    />
  );
}

function getStatusLabel(call: CallSession | null) {
  if (!call) return "";

  if (call.status === "incoming") {
    return "Cuoc goi den";
  }

  if (call.status === "calling") {
    return "Dang goi va cho doi phuong bat may";
  }

  if (call.status === "connecting") {
    return "Dang ket noi video";
  }

  if (call.status === "connected") {
    return "Da ket noi";
  }

  return "Dang goi";
}

export default function VideoCallOverlay({
  incomingCall,
  activeCall,
  localStream,
  remoteStream,
  isMicMuted,
  isCameraEnabled,
  onAcceptIncomingCall,
  onRejectIncomingCall,
  onEndCall,
  onToggleMicrophone,
  onToggleCamera,
}: VideoCallOverlayProps) {
  const peerUser = activeCall?.peerUser;
  const avatarSrc = imageApi.buildViewUrl(peerUser?.avatarKey, peerUser?.avatarUrl);

  return (
    <>
      {incomingCall && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-primary/20 bg-background/95 p-6 shadow-2xl">
            <div className="mb-5">
              <p className="text-lg font-semibold text-foreground">Cuoc goi video den</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {incomingCall.peerUser.displayName || "Doi phuong"} dang goi cho ban.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-4">
              <Avatar className="h-12 w-12 border border-primary/20">
                <AvatarImage src={imageApi.buildViewUrl(
                  incomingCall.peerUser.avatarKey,
                  incomingCall.peerUser.avatarUrl
                )} />
                <AvatarFallback>{getInitial(incomingCall.peerUser.displayName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {incomingCall.peerUser.displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {incomingCall.peerUser.email}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onRejectIncomingCall}
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <PhoneOff />
                Tu choi
              </Button>
              <Button type="button" onClick={onAcceptIncomingCall}>
                <Video />
                Nhan cuoc goi
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeCall && (
        <div className="fixed inset-0 z-[80] bg-black">
          {remoteStream ? (
            <StreamVideo
              stream={remoteStream}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 text-center">
              <Avatar className="h-24 w-24 border border-white/15">
                <AvatarImage src={avatarSrc} alt={peerUser?.displayName} />
                <AvatarFallback className="bg-white/10 text-2xl text-white">
                  {getInitial(peerUser?.displayName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold text-white">
                  {peerUser?.displayName || "Doi phuong"}
                </p>
                <p className="mt-2 text-sm text-white/70">{getStatusLabel(activeCall)}</p>
              </div>
            </div>
          )}

          {localStream && (
            <div className="absolute right-4 top-20 overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl">
              <div className="relative">
                <StreamVideo
                  stream={localStream}
                  muted
                  className="h-36 w-24 object-cover sm:h-44 sm:w-32"
                />
                {!isCameraEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-xs text-white/80">
                    Camera tat
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="absolute inset-x-0 top-20 flex justify-center px-6">
            <div className="rounded-2xl bg-black/45 px-4 py-3 text-sm text-white/85 backdrop-blur">
              <div className="text-center">
                <p>{peerUser?.displayName || "Doi phuong"} - {getStatusLabel(activeCall)}</p>
                <p className="mt-1 text-[11px] text-white/55">
                  Call ID: {activeCall.callId.slice(0, 8)}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-10 flex justify-center gap-4 px-6">
            <button
              type="button"
              onClick={onToggleMicrophone}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white shadow-2xl transition-transform hover:scale-105"
            >
              {isMicMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            <button
              type="button"
              onClick={onToggleCamera}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white shadow-2xl transition-transform hover:scale-105"
            >
              {isCameraEnabled ? <Video size={22} /> : <VideoOff size={22} />}
            </button>
            <button
              type="button"
              onClick={onEndCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-2xl transition-transform hover:scale-105"
            >
              <PhoneOff size={26} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
