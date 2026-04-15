package com.sba302.reminer.module.unsent.entity;

import com.sba302.reminer.common.enums.UnsentMessageStatus;
import com.sba302.reminer.module.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "unsent_messages")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class UnsentMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Sensitive content — never log this field.
     */
    @Column(name = "content", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private UnsentMessageStatus status = UnsentMessageStatus.ACTIVE;

    @Column(name = "released_at")
    private Instant releasedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Soft delete — null means not deleted.
     */
    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(name = "image_key", length = 500)
    private String imageKey;

    public boolean isDeleted() {
        return deletedAt != null;
    }
}
