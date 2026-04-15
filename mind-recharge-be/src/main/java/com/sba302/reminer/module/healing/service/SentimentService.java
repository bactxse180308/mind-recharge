package com.sba302.reminer.module.healing.service;

public interface SentimentService {
    /**
     * Analyze text and return sentiment score.
     * MVP rule-based: -1 (Negative), 0 (Neutral), 1 (Positive)
     * To be upgraded to AI later.
     */
    int analyze(String text);
}
