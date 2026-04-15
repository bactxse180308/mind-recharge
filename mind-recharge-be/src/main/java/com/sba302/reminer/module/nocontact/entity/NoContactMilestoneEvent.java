package com.sba302.reminer.module.nocontact.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
    name = "no_contact_milestone_events",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_milestone_journey_day",
        columnNames = {"journey_id", "milestone_day"}
    )
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoContactMilestoneEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "journey_id", nullable = false)
    private NoContactJourney journey;

    @Column(name = "milestone_day", nullable = false)
    private Integer milestoneDay;

    @Column(name = "achieved_at", nullable = false)
    @Builder.Default
    private Instant achievedAt = Instant.now();
}
