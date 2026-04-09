package com.sba302.reminer.common.enums;

public enum JournalMoodCode {
    SAD(1),
    NEUTRAL(2),
    BETTER(3),
    CALM(4),
    LOVE(5);

    private final int score;

    JournalMoodCode(int score) {
        this.score = score;
    }

    public int getScore() {
        return score;
    }
}
