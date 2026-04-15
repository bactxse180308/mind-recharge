import { useCallback, useEffect, useRef, useState } from "react";

const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

interface UseVideoCallOptions {
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

export function useVideoCall(options: UseVideoCallOptions = {}) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const onIceCandidateRef = useRef(options.onIceCandidate);
  const onConnectionStateChangeRef = useRef(options.onConnectionStateChange);

  useEffect(() => {
    onIceCandidateRef.current = options.onIceCandidate;
    onConnectionStateChangeRef.current = options.onConnectionStateChange;
  }, [options.onConnectionStateChange, options.onIceCandidate]);

  const closePeerConnection = useCallback(() => {
    const connection = peerConnectionRef.current;
    if (!connection) return;

    connection.onicecandidate = null;
    connection.ontrack = null;
    connection.onconnectionstatechange = null;
    connection.close();
    peerConnectionRef.current = null;
    pendingIceCandidatesRef.current = [];

    remoteStreamRef.current = null;
    setRemoteStream(null);
  }, []);

  const stopStream = useCallback((stream: MediaStream | null) => {
    stream?.getTracks().forEach((track) => track.stop());
  }, []);

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current && localStreamRef.current.active) {
      return localStreamRef.current;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Video call is not supported on this device");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const flushPendingIceCandidates = useCallback(async () => {
    const connection = peerConnectionRef.current;
    if (!connection || !connection.remoteDescription) {
      return;
    }

    const pendingCandidates = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];

    for (const candidate of pendingCandidates) {
      await connection.addIceCandidate(candidate);
    }
  }, []);

  const ensurePeerConnection = useCallback(async () => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const stream = await ensureLocalStream();
    const connection = new RTCPeerConnection(RTC_CONFIGURATION);
    const nextRemoteStream = new MediaStream();

    remoteStreamRef.current = nextRemoteStream;
    setRemoteStream(nextRemoteStream);

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidateRef.current?.(event.candidate);
      }
    };

    connection.ontrack = (event) => {
      const targetStream = remoteStreamRef.current ?? nextRemoteStream;

      if (event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => targetStream.addTrack(track));
        return;
      }

      targetStream.addTrack(event.track);
    };

    connection.onconnectionstatechange = () => {
      onConnectionStateChangeRef.current?.(connection.connectionState);
    };

    stream.getTracks().forEach((track) => {
      connection.addTrack(track, stream);
    });

    peerConnectionRef.current = connection;
    return connection;
  }, [ensureLocalStream]);

  const createOffer = useCallback(async () => {
    const connection = await ensurePeerConnection();
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    return connection.localDescription;
  }, [ensurePeerConnection]);

  const handleOffer = useCallback(
    async (sdp: string) => {
      const connection = await ensurePeerConnection();
      await connection.setRemoteDescription({ type: "offer", sdp });
      await flushPendingIceCandidates();

      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      return connection.localDescription;
    },
    [ensurePeerConnection, flushPendingIceCandidates]
  );

  const handleAnswer = useCallback(
    async (sdp: string) => {
      const connection = await ensurePeerConnection();
      await connection.setRemoteDescription({ type: "answer", sdp });
      await flushPendingIceCandidates();
    },
    [ensurePeerConnection, flushPendingIceCandidates]
  );

  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const connection = peerConnectionRef.current;

    if (!connection || !connection.remoteDescription) {
      pendingIceCandidatesRef.current.push(candidate);
      return;
    }

    await connection.addIceCandidate(candidate);
  }, []);

  const cleanup = useCallback(() => {
    closePeerConnection();

    stopStream(localStreamRef.current);
    stopStream(remoteStreamRef.current);

    localStreamRef.current = null;
    remoteStreamRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);
  }, [closePeerConnection, stopStream]);

  useEffect(() => cleanup, [cleanup]);

  return {
    localStream,
    remoteStream,
    ensureLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
    cleanup,
  };
}
