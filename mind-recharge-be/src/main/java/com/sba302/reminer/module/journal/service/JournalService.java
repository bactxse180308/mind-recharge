package com.sba302.reminer.module.journal.service;

import com.sba302.reminer.module.journal.dto.request.CreateJournalRequest;
import com.sba302.reminer.module.journal.dto.request.UpdateJournalRequest;
import com.sba302.reminer.module.journal.dto.response.JournalResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface JournalService {

    JournalResponse create(Long userId, CreateJournalRequest request);

    Page<JournalResponse> list(Long userId, Pageable pageable);

    JournalResponse getById(Long userId, Long id);

    JournalResponse update(Long userId, Long id, UpdateJournalRequest request);

    void delete(Long userId, Long id);

    List<JournalResponse> getHighlight(Long userId);
}
