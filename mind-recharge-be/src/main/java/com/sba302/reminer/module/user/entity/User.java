package com.sba302.reminer.module.user.entity;

import com.sba302.reminer.common.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    /**
     * IANA timezone string, e.g. "Asia/Ho_Chi_Minh". Used to determine user's local date.
     */
    @Column(nullable = false, length = 60)
    @Builder.Default
    private String timezone = "UTC";

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String locale = "vi";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    /**
     * Quan hệ ManyToOne với Role entity
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "security_password_hash", length = 255)
    private String securityPasswordHash;

    @Column(name = "security_password_updated_at")
    private Instant securityPasswordUpdatedAt;

    @Column(name = "security_password_failed_attempts", nullable = false)
    @Builder.Default
    private Integer securityPasswordFailedAttempts = 0;

    @Column(name = "security_password_locked_until")
    private Instant securityPasswordLockedUntil;
}
