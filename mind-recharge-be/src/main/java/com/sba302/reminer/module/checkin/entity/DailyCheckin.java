package com.sba302.reminer.module.checkin.entity;

import com.sba302.reminer.common.enums.MoodLevel;
import com.sba302.reminer.module.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
    name = "daily_checkins",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_daily_checkins_user_date",
        columnNames = {"user_id", "checkin_date"}
    )
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class DailyCheckin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Local date in the user's timezone — stored as plain DATE in DB.
     */
    @Column(name = "checkin_date", nullable = false)
    private LocalDate checkinDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "mood_level", nullable = false, length = 20)
    private MoodLevel moodLevel;

    /**
     * Key referencing content_items.content_key for the mood response text.
     */
    @Column(name = "response_key", nullable = false, length = 100)
    private String responseKey;

    @Column(name = "note", columnDefinition = "NVARCHAR(MAX)")
    private String note;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
