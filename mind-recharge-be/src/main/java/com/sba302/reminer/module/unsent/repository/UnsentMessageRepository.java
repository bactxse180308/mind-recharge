package com.sba302.reminer.module.unsent.repository;

import com.sba302.reminer.module.unsent.entity.UnsentMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface UnsentMessageRepository
        extends JpaRepository<UnsentMessage, Long>,
                JpaSpecificationExecutor<UnsentMessage> {
}
