package com.sba302.reminer.module.dailytask.service;

import com.sba302.reminer.module.dailytask.entity.DailyTaskTemplate;
import com.sba302.reminer.module.dailytask.repository.DailyTaskTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DailyTaskTemplateCatalogService {

    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    private final DailyTaskTemplateRepository dailyTaskTemplateRepository;

    private volatile Snapshot snapshot;

    public List<TaskTemplateSnapshot> getActiveTemplates() {
        return getSnapshot().templates();
    }

    public int getActiveTemplateCount() {
        return getSnapshot().count();
    }

    private Snapshot getSnapshot() {
        Snapshot current = snapshot;
        if (current != null && current.expiresAt().isAfter(Instant.now())) {
            return current;
        }

        synchronized (this) {
            current = snapshot;
            if (current != null && current.expiresAt().isAfter(Instant.now())) {
                return current;
            }

            Snapshot refreshed = loadSnapshot();
            snapshot = refreshed;
            return refreshed;
        }
    }

    private Snapshot loadSnapshot() {
        List<TaskTemplateSnapshot> templates = dailyTaskTemplateRepository.findByIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(this::toSnapshot)
                .toList();

        return new Snapshot(
                Instant.now().plus(CACHE_TTL),
                templates,
                templates.size()
        );
    }

    private TaskTemplateSnapshot toSnapshot(DailyTaskTemplate template) {
        return new TaskTemplateSnapshot(
                template.getId(),
                template.getCode(),
                template.getTitle(),
                template.getEmoji(),
                template.getSortOrder()
        );
    }

    private record Snapshot(
            Instant expiresAt,
            List<TaskTemplateSnapshot> templates,
            int count
    ) {
    }

    public record TaskTemplateSnapshot(
            Long id,
            String code,
            String title,
            String emoji,
            Integer sortOrder
    ) {
    }
}
