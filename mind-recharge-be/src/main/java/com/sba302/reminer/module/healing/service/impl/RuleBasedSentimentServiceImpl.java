package com.sba302.reminer.module.healing.service.impl;

import com.sba302.reminer.module.healing.service.SentimentService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
class RuleBasedSentimentServiceImpl implements SentimentService {

    private static final List<String> NEGATIVE_KEYWORDS = List.of(
            "buồn", "cô đơn", "nhớ", "chán", "tệ", "tức giận", "tuyệt vọng", "đau", "khóc"
    );

    private static final List<String> POSITIVE_KEYWORDS = List.of(
            "ổn", "tốt", "vui", "đỡ hơn", "hạnh phúc", "tuyệt vời", "tự hào", "biết ơn"
    );

    @Override
    public int analyze(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }

        String lowerText = text.toLowerCase();

        boolean hasNegative = NEGATIVE_KEYWORDS.stream().anyMatch(lowerText::contains);
        boolean hasPositive = POSITIVE_KEYWORDS.stream().anyMatch(lowerText::contains);

        if (hasNegative && !hasPositive) {
            return -1;
        } else if (hasPositive && !hasNegative) {
            return 1;
        }

        return 0;
    }
}
