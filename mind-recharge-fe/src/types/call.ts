import type { ChatConversation, ChatUserSummary } from "@/services/chatApi";

export type CallSignalType =
  | "call.invite"
  | "call.accept"
  | "call.reject"
  | "call.offer"
  | "call.answer"
  | "call.ice-candidate"
  | "call.end";

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
  createdAt?: string;
}

export interface CallSession {
  callId: string;
  conversationId: number;
  peerUser: ChatUserSummary;
  direction: "incoming" | "outgoing";
  status: "incoming" | "calling" | "connecting" | "connected";
}

export interface CallContextValue {
  incomingCall: CallSession | null;
  activeCall: CallSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isRealtimeReady: boolean;
  startOutgoingCall: (conversation: ChatConversation) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => void;
  endCall: () => void;
}
