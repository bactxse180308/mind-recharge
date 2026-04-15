package com.sba302.reminer.common.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PageMeta {

    private final int page;
    private final int size;
    private final long totalElements;
    private final int totalPages;
    private final boolean last;

    public static PageMeta of(org.springframework.data.domain.Page<?> page) {
        return PageMeta.builder()
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
