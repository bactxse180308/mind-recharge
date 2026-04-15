import type { ChatConversation, ChatUserSummary } from "@/services/chatApi";

export type CallSignalType =
  | "call.invite"
  | "call.accept"
  | "call.reject"
  | "call.offer"
  | "call.answer"
  | "call.ice-candidate"
  | "call.end";

export type CallSignalReason =
  | "busy"
  | "declined"
  | "missed"
  | "cancelled"
  | "no-answer"
  | "connection-timeout"
  | "network-lost"
  | "page-unload"
  | "permission-denied"
  | "connection-failed"
  | "ended";

export type CallSessionStatus =
  | "incoming"
  | "calling"
  | "connecting"
  | "connected";

export interface CallSignalEvent {
  eventType: CallSignalType;
  signalType: CallSignalType;
  conversationId: number;
  callId: string;
  fromUser: ChatUserSummary;
  sdp?: string;
  candidate?: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
  reason?: CallSignalReason;
  createdAt?: string;
}

export interface CallSession {
  callId: string;
  conversationId: number;
  peerUser: ChatUserSummary;
  direction: "incoming" | "outgoing";
  status: CallSessionStatus;
  startedAt: number;
  connectedAt?: number;
}

export interface CallContextValue {
  incomingCall: CallSession | null;
  activeCall: CallSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isRealtimeReady: boolean;
  isMicMuted: boolean;
  isCameraEnabled: boolean;
  startOutgoingCall: (conversation: ChatConversation) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => void;
  endCall: () => void;
  toggleMicrophone: () => void;
  toggleCamera: () => void;
}
