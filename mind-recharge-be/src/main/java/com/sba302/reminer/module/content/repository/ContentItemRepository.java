package com.sba302.reminer.module.content.repository;

import com.sba302.reminer.common.enums.ContentType;
import com.sba302.reminer.module.content.entity.ContentItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContentItemRepository extends JpaRepository<ContentItem, Long> {

    List<ContentItem> findByIsActiveTrueOrderByContentTypeAscSortOrderAsc();

    List<ContentItem> findByContentTypeAndIsActiveTrueOrderBySortOrderAsc(ContentType contentType);

    Optional<ContentItem> findByContentTypeAndContentKey(ContentType contentType, String contentKey);
}
