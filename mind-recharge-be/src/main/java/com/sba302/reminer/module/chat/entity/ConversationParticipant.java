package com.sba302.reminer.module.chat.entity;

import com.sba302.reminer.common.enums.ChatParticipantRole;
import com.sba302.reminer.module.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "conversation_participants", uniqueConstraints = {
        @UniqueConstraint(name = "uk_conversation_participants_pair", columnNames = {"conversation_id", "user_id"})
}, indexes = {
        @Index(name = "idx_conversation_participants_user", columnList = "user_id"),
        @Index(name = "idx_conversation_participants_conversation", columnList = "conversation_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class ConversationParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ChatParticipantRole role = ChatParticipantRole.MEMBER;

    @Column(name = "last_read_at")
    private Instant lastReadAt;

    @CreatedDate
    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
