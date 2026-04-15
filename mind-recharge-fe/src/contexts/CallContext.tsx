import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import VideoCallOverlay from "@/components/VideoCallOverlay";
import { useAuth } from "@/contexts/AuthContext";
import { useVideoCall } from "@/hooks/useVideoCall";
import { createRealtimeClient } from "@/lib/chatRealtime";
import type { ChatConversation, ChatUserSummary } from "@/services/chatApi";
import type {
  CallContextValue,
  CallSession,
  CallSignalEvent,
  CallSignalReason,
  CallSignalType,
} from "@/types/call";

const CallContext = createContext<CallContextValue | null>(null);

const OUTGOING_CALL_TIMEOUT_MS = 30_000;
const INCOMING_CALL_TIMEOUT_MS = 35_000;

function createCallId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `call-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createSession(
  direction: "incoming" | "outgoing",
  status: CallSession["status"],
  conversationId: number,
  callId: string,
  peerUser: ChatUserSummary
): CallSession {
  return {
    callId,
    conversationId,
    peerUser,
    direction,
    status,
    startedAt: Date.now(),
  };
}

function encodeSignalText(value?: string) {
  if (!value) return value;
  return `b64:${btoa(value)}`;
}

function decodeSignalText(value?: string) {
  if (!value) return value;
  if (!value.startsWith("b64:")) {
    return value;
  }

  try {
    return atob(value.slice(4));
  } catch (error) {
    console.error("[Call] Failed to decode signal payload", error);
    return value;
  }
}

function toCandidatePayload(event: CallSignalEvent): RTCIceCandidateInit {
  return {
    candidate: decodeSignalText(event.candidate) ?? "",
    sdpMid: decodeSignalText(event.sdpMid) ?? null,
    sdpMLineIndex: event.sdpMLineIndex ?? null,
  };
}

function isPermissionError(error: unknown) {
  if (!(error instanceof DOMException)) {
    return false;
  }

  return error.name === "NotAllowedError" || error.name === "PermissionDeniedError";
}

function getReasonMessage(reason?: CallSignalReason, signalType?: CallSignalType) {
  if (reason === "busy") return "Doi phuong dang trong mot cuoc goi khac.";
  if (reason === "declined") return "Doi phuong da tu choi cuoc goi.";
  if (reason === "missed") return "Cuoc goi da het thoi gian cho phan hoi.";
  if (reason === "cancelled") return "Cuoc goi da bi huy.";
  if (reason === "no-answer") return "Doi phuong khong tra loi cuoc goi.";
  if (reason === "connection-timeout") return "Khong the ket noi cuoc goi trong thoi gian cho.";
  if (reason === "network-lost") return "Cuoc goi da ket thuc do mat ket noi mang.";
  if (reason === "page-unload") return "Doi phuong da roi khoi trang.";
  if (reason === "permission-denied") return "Khong co quyen su dung camera hoac micro.";
  if (reason === "connection-failed") return "Ket noi cuoc goi bi loi.";
  if (signalType === "call.reject") return "Doi phuong da tu choi cuoc goi.";
  if (signalType === "call.end") return "Doi phuong da ket thuc cuoc goi.";
  return "Cuoc goi da ket thuc.";
}

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [isRealtimeReady, setIsRealtimeReady] = useState(false);

  const activeCallRef = useRef<CallSession | null>(null);
  const incomingCallRef = useRef<CallSession | null>(null);
  const clientRef = useRef<ReturnType<typeof createRealtimeClient> | null>(null);
  const cleanupRef = useRef<() => void>(() => undefined);
  const handlePeerDisconnectedRef = useRef<
    (message: string, reason?: CallSignalReason) => void
  >(() => undefined);
  const outgoingTimeoutRef = useRef<number | null>(null);
  const incomingTimeoutRef = useRef<number | null>(null);

  const clearCallTimers = useCallback(() => {
    if (outgoingTimeoutRef.current) {
      window.clearTimeout(outgoingTimeoutRef.current);
      outgoingTimeoutRef.current = null;
    }

    if (incomingTimeoutRef.current) {
      window.clearTimeout(incomingTimeoutRef.current);
      incomingTimeoutRef.current = null;
    }
  }, []);

  const updateActiveCall = useCallback((call: CallSession | null) => {
    activeCallRef.current = call;
    setActiveCall(call);
  }, []);

  const updateIncomingCall = useCallback((call: CallSession | null) => {
    incomingCallRef.current = call;
    setIncomingCall(call);
  }, []);

  const clearCallState = useCallback(() => {
    clearCallTimers();
    updateIncomingCall(null);
    updateActiveCall(null);
  }, [clearCallTimers, updateActiveCall, updateIncomingCall]);

  const logCallPhase = useCallback(
    (
      phase: string,
      session: Pick<CallSession, "callId" | "conversationId" | "direction" | "status">,
      extra?: Record<string, unknown>
    ) => {
      console.info("[Call][Phase]", {
        callId: session.callId,
        conversationId: session.conversationId,
        direction: session.direction,
        status: session.status,
        phase,
        ...extra,
      });
    },
    []
  );

  const sendSignal = useCallback(
    (
      signalType: CallSignalType,
      session: Pick<CallSession, "conversationId" | "callId">,
      extra: Partial<
        Pick<
          CallSignalEvent,
          "sdp" | "candidate" | "sdpMid" | "sdpMLineIndex" | "reason"
        >
      > = {}
    ) => {
      const client = clientRef.current;
      if (!client?.connected) {
        throw new Error("Realtime connection is not ready");
      }

      console.info("[Call] Sending signal", {
        signalType,
        conversationId: session.conversationId,
        callId: session.callId,
        reason: extra.reason,
      });

      client.publish({
        destination: "/app/call/signal",
        body: JSON.stringify({
          conversationId: session.conversationId,
          callId: session.callId,
          signalType,
          reason: extra.reason,
          sdp: encodeSignalText(extra.sdp),
          candidate: encodeSignalText(extra.candidate),
          sdpMid: encodeSignalText(extra.sdpMid),
          sdpMLineIndex: extra.sdpMLineIndex,
        }),
      });
    },
    []
  );

  const {
    localStream,
    remoteStream,
    isMicMuted,
    isCameraEnabled,
    ensureLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
    toggleMicrophone,
    toggleCamera,
    cleanup,
  } = useVideoCall({
    onIceCandidate: (candidate) => {
      const session = activeCallRef.current;
      if (!session) return;

      try {
        sendSignal("call.ice-candidate", session, {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid ?? undefined,
          sdpMLineIndex: candidate.sdpMLineIndex ?? undefined,
        });
      } catch {
        toast.error("Khong the dong bo ket noi cuoc goi.");
      }
    },
    onConnectionStateChange: (state) => {
      const session = activeCallRef.current;
      if (!session) return;

      if (state === "connected") {
        const connectedAt = session.connectedAt ?? Date.now();
        const nextSession = {
          ...session,
          status: "connected" as const,
          connectedAt,
        };
        updateActiveCall(nextSession);
        clearCallTimers();
        logCallPhase("connected", nextSession, {
          setupMs: connectedAt - session.startedAt,
        });
        return;
      }

      if (state === "failed" || state === "closed") {
        handlePeerDisconnectedRef.current(
          getReasonMessage("connection-failed"),
          "connection-failed"
        );
      }
    },
  });

  useEffect(() => {
    cleanupRef.current = cleanup;
  }, [cleanup]);

  const handlePeerDisconnected = useCallback(
    (message: string, reason: CallSignalReason = "connection-failed") => {
      const session = activeCallRef.current ?? incomingCallRef.current;
      if (session) {
        logCallPhase("terminated", session, {
          reason,
          durationMs: session.connectedAt ? Date.now() - session.connectedAt : undefined,
        });
      }

      clearCallState();
      cleanupRef.current();
      toast.error(message);
    },
    [clearCallState, logCallPhase]
  );

  useEffect(() => {
    handlePeerDisconnectedRef.current = handlePeerDisconnected;
  }, [handlePeerDisconnected]);

  const scheduleOutgoingTimeout = useCallback(
    (session: CallSession) => {
      if (outgoingTimeoutRef.current) {
        window.clearTimeout(outgoingTimeoutRef.current);
      }

      outgoingTimeoutRef.current = window.setTimeout(() => {
        const current = activeCallRef.current;
        if (!current || current.callId !== session.callId) {
          return;
        }

        const reason: CallSignalReason =
          current.status === "calling" ? "no-answer" : "connection-timeout";
        logCallPhase("timeout", current, { reason });

        try {
          sendSignal("call.end", current, { reason });
        } catch {
          // Ignore best-effort timeout signaling failures.
        }

        clearCallState();
        cleanupRef.current();
        toast.error(getReasonMessage(reason));
      }, OUTGOING_CALL_TIMEOUT_MS);
    },
    [clearCallState, logCallPhase, sendSignal]
  );

  const scheduleIncomingTimeout = useCallback(
    (session: CallSession) => {
      if (incomingTimeoutRef.current) {
        window.clearTimeout(incomingTimeoutRef.current);
      }

      incomingTimeoutRef.current = window.setTimeout(() => {
        const current = incomingCallRef.current;
        if (!current || current.callId !== session.callId) {
          return;
        }

        logCallPhase("missed", current, { reason: "missed" });
        try {
          sendSignal("call.reject", current, { reason: "missed" });
        } catch {
          // Ignore best-effort timeout signaling failures.
        }

        updateIncomingCall(null);
        toast.error(getReasonMessage("missed"));
      }, INCOMING_CALL_TIMEOUT_MS);
    },
    [logCallPhase, sendSignal, updateIncomingCall]
  );

  const bestEffortCloseSession = useCallback(
    (reason: CallSignalReason, showToast = false) => {
      const currentIncoming = incomingCallRef.current;
      const currentActive = activeCallRef.current;
      const session = currentActive ?? currentIncoming;
      if (!session) return;

      const signalType: CallSignalType =
        currentIncoming && currentIncoming.callId === session.callId && session.status === "incoming"
          ? "call.reject"
          : "call.end";

      try {
        sendSignal(signalType, session, { reason });
      } catch {
        // Ignore best-effort close failures.
      }

      logCallPhase("local-close", session, { reason, signalType });
      clearCallState();
      cleanupRef.current();

      if (showToast) {
        toast.error(getReasonMessage(reason));
      }
    },
    [clearCallState, logCallPhase, sendSignal]
  );

  const handleSignal = useCallback(
    async (event: CallSignalEvent) => {
      console.info("[Call] Received signal", {
        signalType: event.signalType,
        conversationId: event.conversationId,
        callId: event.callId,
        fromUserId: event.fromUser?.id,
        reason: event.reason,
      });

      const session =
        activeCallRef.current && activeCallRef.current.callId === event.callId
          ? activeCallRef.current
          : incomingCallRef.current && incomingCallRef.current.callId === event.callId
            ? incomingCallRef.current
            : null;

      if (event.signalType === "call.invite") {
        if (activeCallRef.current || incomingCallRef.current) {
          try {
            sendSignal("call.reject", {
              conversationId: event.conversationId,
              callId: event.callId,
            }, {
              reason: "busy",
            });
          } catch {
            // Ignore busy rejection failures.
          }
          return;
        }

        const nextSession = createSession(
          "incoming",
          "incoming",
          event.conversationId,
          event.callId,
          event.fromUser
        );
        updateIncomingCall(nextSession);
        scheduleIncomingTimeout(nextSession);
        logCallPhase("incoming", nextSession);
        return;
      }

      if (!session) {
        return;
      }

      if (event.signalType === "call.accept") {
        if (session.direction !== "outgoing") {
          return;
        }

        const nextSession = { ...session, status: "connecting" as const };
        updateActiveCall(nextSession);
        logCallPhase("accepted", nextSession);

        try {
          const offer = await createOffer();
          if (!offer?.sdp) {
            throw new Error("Offer SDP is missing");
          }

          sendSignal("call.offer", nextSession, { sdp: offer.sdp });
          logCallPhase("offer-sent", nextSession);
        } catch (error) {
          console.error("[Call] Failed to create/send offer", error);
          handlePeerDisconnected(getReasonMessage("connection-failed"), "connection-failed");
        }
        return;
      }

      if (event.signalType === "call.offer") {
        if (!event.sdp) {
          return;
        }

        const nextSession = { ...session, status: "connecting" as const };
        updateActiveCall(nextSession);
        logCallPhase("offer-received", nextSession);

        try {
          const answer = await handleOffer(decodeSignalText(event.sdp) ?? "");
          if (!answer?.sdp) {
            throw new Error("Answer SDP is missing");
          }

          sendSignal("call.answer", nextSession, { sdp: answer.sdp });
          logCallPhase("answer-sent", nextSession);
        } catch (error) {
          console.error("[Call] Failed to handle/send answer", error);
          handlePeerDisconnected(getReasonMessage("connection-failed"), "connection-failed");
        }
        return;
      }

      if (event.signalType === "call.answer") {
        if (!event.sdp) {
          return;
        }

        try {
          await handleAnswer(decodeSignalText(event.sdp) ?? "");
          const nextSession = { ...session, status: "connecting" as const };
          updateActiveCall(nextSession);
          logCallPhase("answer-received", nextSession);
        } catch (error) {
          console.error("[Call] Failed to apply remote answer", error);
          handlePeerDisconnected(getReasonMessage("connection-failed"), "connection-failed");
        }
        return;
      }

      if (event.signalType === "call.ice-candidate") {
        try {
          await addIceCandidate(toCandidatePayload(event));
          logCallPhase("ice-received", session);
        } catch (error) {
          console.error("[Call] Failed to add ICE candidate", error);
          handlePeerDisconnected(getReasonMessage("connection-failed"), "connection-failed");
        }
        return;
      }

      if (event.signalType === "call.reject" || event.signalType === "call.end") {
        handlePeerDisconnected(
          getReasonMessage(event.reason, event.signalType),
          event.reason ?? "ended"
        );
      }
    },
    [
      addIceCandidate,
      createOffer,
      handleAnswer,
      handleOffer,
      handlePeerDisconnected,
      logCallPhase,
      scheduleIncomingTimeout,
      sendSignal,
      updateActiveCall,
      updateIncomingCall,
    ]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      clientRef.current?.deactivate();
      clientRef.current = null;
      setIsRealtimeReady(false);
      clearCallState();
      cleanup();
      return;
    }

    const client = createRealtimeClient();
    if (!client) {
      setIsRealtimeReady(false);
      return;
    }

    clientRef.current = client;
    client.onConnect = () => {
      console.info("[Call] Realtime channel connected");
      setIsRealtimeReady(true);
      client.subscribe("/user/queue/call", (frame) => {
        try {
          const payload = JSON.parse(frame.body) as CallSignalEvent;
          void handleSignal(payload);
        } catch {
          toast.error("Khong doc duoc du lieu cuoc goi.");
        }
      });
    };
    client.onDisconnect = () => {
      console.warn("[Call] Realtime channel disconnected");
      setIsRealtimeReady(false);
    };
    client.onWebSocketClose = () => {
      console.warn("[Call] WebSocket closed");
      setIsRealtimeReady(false);
    };
    client.onStompError = (frame) => {
      console.error("[Call] STOMP error", frame.headers["message"], frame.body);
      setIsRealtimeReady(false);
      toast.error("Kenh cuoc goi bi loi.");
    };
    client.activate();

    return () => {
      client.deactivate();
      if (clientRef.current === client) {
        clientRef.current = null;
      }
      setIsRealtimeReady(false);
    };
  }, [clearCallState, cleanup, handleSignal, isAuthenticated]);

  useEffect(() => {
    const handlePageExit = () => {
      bestEffortCloseSession("page-unload");
    };

    const handleOffline = () => {
      bestEffortCloseSession("network-lost", true);
    };

    window.addEventListener("pagehide", handlePageExit);
    window.addEventListener("beforeunload", handlePageExit);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("pagehide", handlePageExit);
      window.removeEventListener("beforeunload", handlePageExit);
      window.removeEventListener("offline", handleOffline);
    };
  }, [bestEffortCloseSession]);

  const startOutgoingCall = useCallback(
    async (conversation: ChatConversation) => {
      if (!isRealtimeReady) {
        toast.error("Ket noi realtime chua san sang.");
        return;
      }

      if (!user) {
        toast.error("Ban can dang nhap lai de thuc hien cuoc goi.");
        return;
      }

      if (activeCallRef.current || incomingCallRef.current) {
        toast.error("Dang co mot cuoc goi khac.");
        return;
      }

      const peerUser =
        conversation.counterpart ??
        conversation.participants.find(
          (participant: ChatUserSummary) => participant.id !== user.userId
        );

      if (!peerUser) {
        toast.error("Khong tim thay nguoi nhan cuoc goi.");
        return;
      }

      try {
        await ensureLocalStream();
        const nextCall = createSession(
          "outgoing",
          "calling",
          conversation.id,
          createCallId(),
          peerUser
        );

        updateActiveCall(nextCall);
        logCallPhase("invite", nextCall);
        sendSignal("call.invite", nextCall);
        scheduleOutgoingTimeout(nextCall);
      } catch (error) {
        console.error("[Call] Failed to start outgoing call", error);
        cleanup();
        clearCallState();
        toast.error(
          isPermissionError(error)
            ? getReasonMessage("permission-denied")
            : "Khong the truy cap camera hoac micro."
        );
      }
    },
    [
      clearCallState,
      cleanup,
      ensureLocalStream,
      isRealtimeReady,
      logCallPhase,
      scheduleOutgoingTimeout,
      sendSignal,
      updateActiveCall,
      user,
    ]
  );

  const acceptIncomingCall = useCallback(async () => {
    const session = incomingCallRef.current;
    if (!session) return;

    try {
      clearCallTimers();
      await ensureLocalStream();
      updateIncomingCall(null);
      const nextSession = { ...session, status: "connecting" as const };
      updateActiveCall(nextSession);
      logCallPhase("accepted-locally", nextSession);
      sendSignal("call.accept", nextSession);
      scheduleOutgoingTimeout(nextSession);
    } catch (error) {
      console.error("[Call] Failed to accept incoming call", error);
      cleanup();
      clearCallState();
      toast.error(
        isPermissionError(error)
          ? getReasonMessage("permission-denied")
          : "Khong the truy cap camera hoac micro."
      );
    }
  }, [
    clearCallState,
    clearCallTimers,
    cleanup,
    ensureLocalStream,
    logCallPhase,
    scheduleOutgoingTimeout,
    sendSignal,
    updateActiveCall,
    updateIncomingCall,
  ]);

  const rejectIncomingCall = useCallback(() => {
    const session = incomingCallRef.current;
    if (!session) return;

    try {
      sendSignal("call.reject", session, { reason: "declined" });
      logCallPhase("declined", session, { reason: "declined" });
    } catch {
      // Ignore realtime failures while rejecting.
    }

    clearCallTimers();
    updateIncomingCall(null);
  }, [clearCallTimers, logCallPhase, sendSignal, updateIncomingCall]);

  const endCall = useCallback(() => {
    const session = activeCallRef.current ?? incomingCallRef.current;

    if (session) {
      try {
        sendSignal(
          incomingCallRef.current && incomingCallRef.current.callId === session.callId
            ? "call.reject"
            : "call.end",
          session,
          {
            reason: incomingCallRef.current ? "declined" : "cancelled",
          }
        );
        logCallPhase("ended-locally", session, {
          reason: incomingCallRef.current ? "declined" : "cancelled",
        });
      } catch {
        // Ignore realtime failures while closing locally.
      }
    }

    clearCallState();
    cleanup();
  }, [clearCallState, cleanup, logCallPhase, sendSignal]);

  return (
    <CallContext.Provider
      value={{
        incomingCall,
        activeCall,
        localStream,
        remoteStream,
        isRealtimeReady,
        isMicMuted,
        isCameraEnabled,
        startOutgoingCall,
        acceptIncomingCall,
        rejectIncomingCall,
        endCall,
        toggleMicrophone,
        toggleCamera,
      }}
    >
      {children}
      <VideoCallOverlay
        incomingCall={incomingCall}
        activeCall={activeCall}
        localStream={localStream}
        remoteStream={remoteStream}
        isMicMuted={isMicMuted}
        isCameraEnabled={isCameraEnabled}
        onAcceptIncomingCall={() => void acceptIncomingCall()}
        onRejectIncomingCall={rejectIncomingCall}
        onEndCall={endCall}
        onToggleMicrophone={toggleMicrophone}
        onToggleCamera={toggleCamera}
      />
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within CallProvider");
  }

  return context;
};
