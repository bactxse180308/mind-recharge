package com.sba302.reminer.module.journal.repository;

import com.sba302.reminer.module.journal.entity.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JournalEntryRepository
        extends JpaRepository<JournalEntry, Long>,
                JpaSpecificationExecutor<JournalEntry> {

    /**
     * Used for simple single-record lookup by composite key.
     * Soft-delete filter (deletedAt IS NULL) applied via Specification in service.
     */
    Optional<JournalEntry> findByIdAndUserId(Long id, Long userId);
}
