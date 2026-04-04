package com.sba302.reminer.module.content.entity;

import com.sba302.reminer.common.enums.ContentType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Entity
@Table(name = "content_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 40)
    private ContentType contentType;

    @Column(name = "content_key", nullable = false, length = 100)
    private String contentKey;

    @Column(name = "text", nullable = false, columnDefinition = "TEXT")
    private String text;

    /**
     * Arbitrary JSONB data (e.g. emoji, color, metadata).
     * Mapped as Map<String, Object> — handled by Hibernate's JSON type.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extra_jsonb", columnDefinition = "jsonb")
    private Map<String, Object> extraJsonb;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
