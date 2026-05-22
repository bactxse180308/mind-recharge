package com.sba302.reminer.module.healing.service.impl;

import com.sba302.reminer.common.config.SentimentConfigProperties;
import com.sba302.reminer.module.healing.service.SentimentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
class RuleBasedSentimentServiceImpl implements SentimentService {

    private final SentimentConfigProperties config;

    @Override
    public int analyze(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }

        String lowerText = text.toLowerCase();

        boolean hasNegative = config.getNegativeKeywords().stream().anyMatch(lowerText::contains);
        boolean hasPositive = config.getPositiveKeywords().stream().anyMatch(lowerText::contains);

        if (hasNegative && !hasPositive) {
            return -1;
        } else if (hasPositive && !hasNegative) {
            return 1;
        }

        return 0;
    }
}
