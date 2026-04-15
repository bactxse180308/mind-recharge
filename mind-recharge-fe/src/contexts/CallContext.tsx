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
import { useVideoCall } from "@/hooks/useVideoCall";
import { createRealtimeClient } from "@/lib/chatRealtime";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatConversation, ChatUserSummary } from "@/services/chatApi";
import type {
  CallContextValue,
  CallSession,
  CallSignalEvent,
  CallSignalType,
} from "@/types/call";

const CallContext = createContext<CallContextValue | null>(null);

function createCallId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `call-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function toCandidatePayload(event: CallSignalEvent): RTCIceCandidateInit {
  return {
    candidate: event.candidate ?? "",
    sdpMid: event.sdpMid ?? null,
    sdpMLineIndex: event.sdpMLineIndex ?? null,
  };
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
  const handlePeerDisconnectedRef = useRef<(message: string) => void>(() => undefined);

  const updateActiveCall = useCallback((call: CallSession | null) => {
    activeCallRef.current = call;
    setActiveCall(call);
  }, []);

  const updateIncomingCall = useCallback((call: CallSession | null) => {
    incomingCallRef.current = call;
    setIncomingCall(call);
  }, []);

  const clearCallState = useCallback(() => {
    updateIncomingCall(null);
    updateActiveCall(null);
  }, [updateActiveCall, updateIncomingCall]);

  const sendSignal = useCallback(
    (
      signalType: CallSignalType,
      session: Pick<CallSession, "conversationId" | "callId">,
      extra: Partial<Pick<CallSignalEvent, "sdp" | "candidate" | "sdpMid" | "sdpMLineIndex">> = {}
    ) => {
      const client = clientRef.current;
      if (!client?.connected) {
        throw new Error("Realtime connection is not ready");
      }

      client.publish({
        destination: "/app/call/signal",
        body: JSON.stringify({
          conversationId: session.conversationId,
          callId: session.callId,
          signalType,
          ...extra,
        }),
      });
    },
    []
  );

  const {
    localStream,
    remoteStream,
    ensureLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
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
      if (state === "connected") {
        updateActiveCall(
          activeCallRef.current
            ? { ...activeCallRef.current, status: "connected" }
            : null
        );
        return;
      }

      if (state === "failed" || state === "closed") {
        handlePeerDisconnectedRef.current("Cuoc goi da bi ngat.");
      }
    },
  });

  useEffect(() => {
    cleanupRef.current = cleanup;
  }, [cleanup]);

  const handlePeerDisconnected = useCallback(
    (message: string) => {
      clearCallState();
      cleanupRef.current();
      toast.error(message);
    },
    [clearCallState]
  );

  useEffect(() => {
    handlePeerDisconnectedRef.current = handlePeerDisconnected;
  }, [handlePeerDisconnected]);

  const handleSignal = useCallback(
    async (event: CallSignalEvent) => {
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
            });
          } catch {
            // Ignore busy rejection failures.
          }
          return;
        }

        updateIncomingCall({
          callId: event.callId,
          conversationId: event.conversationId,
          peerUser: event.fromUser,
          direction: "incoming",
          status: "incoming",
        });
        return;
      }

      if (!session) {
        return;
      }

      if (event.signalType === "call.accept") {
        if (session.direction !== "outgoing") {
          return;
        }

        updateActiveCall({ ...session, status: "connecting" });

        try {
          const offer = await createOffer();
          if (!offer?.sdp) {
            throw new Error("Offer SDP is missing");
          }

          sendSignal("call.offer", session, { sdp: offer.sdp });
        } catch {
          handlePeerDisconnected("Khong the bat dau cuoc goi video.");
        }
        return;
      }

      if (event.signalType === "call.offer") {
        if (!event.sdp) {
          return;
        }

        updateActiveCall({ ...session, status: "connecting" });

        try {
          const answer = await handleOffer(event.sdp);
          if (!answer?.sdp) {
            throw new Error("Answer SDP is missing");
          }

          sendSignal("call.answer", session, { sdp: answer.sdp });
        } catch {
          handlePeerDisconnected("Khong the ket noi cuoc goi video.");
        }
        return;
      }

      if (event.signalType === "call.answer") {
        if (!event.sdp) {
          return;
        }

        try {
          await handleAnswer(event.sdp);
          updateActiveCall({ ...session, status: "connecting" });
        } catch {
          handlePeerDisconnected("Khong the hoan tat ket noi cuoc goi.");
        }
        return;
      }

      if (event.signalType === "call.ice-candidate") {
        try {
          await addIceCandidate(toCandidatePayload(event));
        } catch {
          handlePeerDisconnected("Khong the trao doi thong tin ket noi.");
        }
        return;
      }

      if (event.signalType === "call.reject") {
        handlePeerDisconnected("Doi phuong da tu choi cuoc goi.");
        return;
      }

      if (event.signalType === "call.end") {
        handlePeerDisconnected("Doi phuong da ket thuc cuoc goi.");
      }
    },
    [
      handlePeerDisconnected,
      sendSignal,
      updateActiveCall,
      updateIncomingCall,
      addIceCandidate,
      createOffer,
      handleAnswer,
      handleOffer,
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
      setIsRealtimeReady(false);
    };
    client.onWebSocketClose = () => {
      setIsRealtimeReady(false);
    };
    client.onStompError = () => {
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
  }, [
    clearCallState,
    cleanup,
    handleSignal,
    isAuthenticated,
  ]);

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
        const nextCall: CallSession = {
          callId: createCallId(),
          conversationId: conversation.id,
          peerUser,
          direction: "outgoing",
          status: "calling",
        };

        updateActiveCall(nextCall);
        sendSignal("call.invite", nextCall);
      } catch {
        cleanup();
        clearCallState();
        toast.error("Khong the truy cap camera hoac micro.");
      }
    },
    [
      clearCallState,
      cleanup,
      ensureLocalStream,
      isRealtimeReady,
      sendSignal,
      updateActiveCall,
      user,
    ]
  );

  const acceptIncomingCall = useCallback(async () => {
    const session = incomingCallRef.current;
    if (!session) return;

    try {
      await ensureLocalStream();
      updateIncomingCall(null);
      updateActiveCall({ ...session, status: "connecting" });
      sendSignal("call.accept", session);
    } catch {
      cleanup();
      clearCallState();
      toast.error("Khong the truy cap camera hoac micro.");
    }
  }, [clearCallState, cleanup, ensureLocalStream, sendSignal, updateActiveCall, updateIncomingCall]);

  const rejectIncomingCall = useCallback(() => {
    const session = incomingCallRef.current;
    if (!session) return;

    try {
      sendSignal("call.reject", session);
    } catch {
      // Ignore realtime failures while rejecting.
    }

    updateIncomingCall(null);
  }, [sendSignal, updateIncomingCall]);

  const endCall = useCallback(() => {
    const session = activeCallRef.current;

    if (session) {
      try {
        sendSignal("call.end", session);
      } catch {
        // Ignore realtime failures while closing locally.
      }
    }

    clearCallState();
    cleanup();
  }, [clearCallState, cleanup, sendSignal]);

  return (
    <CallContext.Provider
      value={{
        incomingCall,
        activeCall,
        localStream,
        remoteStream,
        isRealtimeReady,
        startOutgoingCall,
        acceptIncomingCall,
        rejectIncomingCall,
        endCall,
      }}
    >
      {children}
      <VideoCallOverlay
        incomingCall={incomingCall}
        activeCall={activeCall}
        localStream={localStream}
        remoteStream={remoteStream}
        onAcceptIncomingCall={() => void acceptIncomingCall()}
        onRejectIncomingCall={rejectIncomingCall}
        onEndCall={endCall}
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
