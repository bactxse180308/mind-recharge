package com.sba302.reminer.module.content.service;

import com.sba302.reminer.common.enums.ContentType;
import com.sba302.reminer.module.content.entity.ContentItem;
import com.sba302.reminer.module.content.repository.ContentItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContentCatalogService {

    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    private final ContentItemRepository contentItemRepository;

    private volatile Snapshot snapshot;

    public Map<String, String> getTextMap(ContentType type) {
        return getSnapshot().textMapByType().getOrDefault(type, Map.of());
    }

    public List<String> getTextList(ContentType type) {
        return getSnapshot().textListByType().getOrDefault(type, List.of());
    }

    public String getText(ContentType type, String contentKey) {
        return getSnapshot().textMapByType()
                .getOrDefault(type, Map.of())
                .get(contentKey);
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
        List<ContentItem> items = contentItemRepository.findByIsActiveTrueOrderByContentTypeAscSortOrderAsc();

        EnumMap<ContentType, Map<String, String>> textMapByType = new EnumMap<>(ContentType.class);
        EnumMap<ContentType, List<String>> textListByType = new EnumMap<>(ContentType.class);

        for (ContentType type : ContentType.values()) {
            textMapByType.put(type, Map.of());
            textListByType.put(type, List.of());
        }

        Map<ContentType, List<ContentItem>> grouped = items.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        ContentItem::getContentType,
                        () -> new EnumMap<>(ContentType.class),
                        java.util.stream.Collectors.toList()
                ));

        for (Map.Entry<ContentType, List<ContentItem>> entry : grouped.entrySet()) {
            ContentType type = entry.getKey();
            List<ContentItem> typeItems = entry.getValue();

            textMapByType.put(type, typeItems.stream().collect(java.util.stream.Collectors.toUnmodifiableMap(
                    ContentItem::getContentKey,
                    ContentItem::getText
            )));

            List<String> texts = new ArrayList<>(typeItems.size());
            for (ContentItem item : typeItems) {
                texts.add(item.getText());
            }
            textListByType.put(type, List.copyOf(texts));
        }

        return new Snapshot(
                Instant.now().plus(CACHE_TTL),
                Map.copyOf(textMapByType),
                Map.copyOf(textListByType)
        );
    }

    private record Snapshot(
            Instant expiresAt,
            Map<ContentType, Map<String, String>> textMapByType,
            Map<ContentType, List<String>> textListByType
    ) {
    }
}
