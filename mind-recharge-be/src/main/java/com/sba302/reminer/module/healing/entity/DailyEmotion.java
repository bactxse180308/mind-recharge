package com.sba302.reminer.module.healing.entity;

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
    name = "daily_emotions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "record_date"})
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class DailyEmotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Column(name = "entry_count", nullable = false)
    @Builder.Default
    private Integer entryCount = 1;

    @Column(name = "avg_mood_score", nullable = false)
    private Double avgMoodScore;

    @Column(name = "avg_sentiment_score", nullable = false)
    private Double avgSentimentScore;

    @Column(name = "total_score", nullable = false)
    private Double totalScore;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
