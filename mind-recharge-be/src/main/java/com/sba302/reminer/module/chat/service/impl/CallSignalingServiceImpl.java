package com.sba302.reminer.module.chat.service.impl;

import com.sba302.reminer.common.exception.AppException;
import com.sba302.reminer.module.chat.dto.request.CallSignalRequest;
import com.sba302.reminer.module.chat.dto.response.CallSignalResponse;
import com.sba302.reminer.module.chat.dto.response.ChatUserSummaryResponse;
import com.sba302.reminer.module.chat.entity.ConversationParticipant;
import com.sba302.reminer.module.chat.repository.ConversationParticipantRepository;
import com.sba302.reminer.module.chat.service.CallRealtimeNotifier;
import com.sba302.reminer.module.chat.service.CallSignalingService;
import com.sba302.reminer.module.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class CallSignalingServiceImpl implements CallSignalingService {

    private final ConversationParticipantRepository participantRepository;
    private final CallRealtimeNotifier realtimeNotifier;

    @Override
    public void publishSignal(Long userId, CallSignalRequest request) {
        validatePayload(request);

        ConversationParticipant senderParticipant = participantRepository
                .findByConversationIdAndUserId(request.getConversationId(), userId)
                .orElseThrow(() -> AppException.forbidden("You are not a participant in this conversation"));

        List<ConversationParticipant> recipients = participantRepository.findByConversationId(request.getConversationId()).stream()
                .filter(participant -> !participant.getUser().getId().equals(userId))
                .toList();

        if (recipients.isEmpty()) {
            throw AppException.badRequest("No recipient found for this call");
        }

        CallSignalResponse event = CallSignalResponse.builder()
                .eventType(request.getSignalType())
                .signalType(request.getSignalType())
                .conversationId(request.getConversationId())
                .callId(request.getCallId().trim())
                .fromUser(toUserSummary(senderParticipant.getUser()))
                .sdp(trimToNull(request.getSdp()))
                .candidate(trimToNull(request.getCandidate()))
                .sdpMid(trimToNull(request.getSdpMid()))
                .sdpMLineIndex(request.getSdpMLineIndex())
                .createdAt(Instant.now())
                .build();

        recipients.forEach(participant ->
                realtimeNotifier.notifyUser(participant.getUser().getId(), event));
    }

    private void validatePayload(CallSignalRequest request) {
        String signalType = request.getSignalType();

        if (("call.offer".equals(signalType) || "call.answer".equals(signalType))
                && !StringUtils.hasText(request.getSdp())) {
            throw AppException.badRequest("SDP is required for offer/answer signals");
        }

        if ("call.ice-candidate".equals(signalType) && !StringUtils.hasText(request.getCandidate())) {
            throw AppException.badRequest("ICE candidate is required");
        }
    }

    private ChatUserSummaryResponse toUserSummary(User user) {
        return ChatUserSummaryResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .avatarKey(user.getAvatarKey())
                .build();
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
