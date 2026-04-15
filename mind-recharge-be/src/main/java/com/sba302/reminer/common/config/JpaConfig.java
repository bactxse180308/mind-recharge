package com.sba302.reminer.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing
public class JpaConfig {
    // Enables @CreatedDate / @LastModifiedDate on all entities using AuditingEntityListener
}
