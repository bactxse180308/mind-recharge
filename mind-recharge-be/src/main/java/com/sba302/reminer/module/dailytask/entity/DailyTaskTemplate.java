package com.sba302.reminer.module.dailytask.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "daily_task_templates")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyTaskTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Business identifier used in API path: PUT /daily-tasks/{taskCode}/status
     */
    @Column(name = "code", nullable = false, unique = true, length = 80)
    private String code;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "emoji", nullable = false, length = 10)
    private String emoji;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @OneToMany(mappedBy = "taskTemplate", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<DailyTaskLog> logs = new ArrayList<>();
}
