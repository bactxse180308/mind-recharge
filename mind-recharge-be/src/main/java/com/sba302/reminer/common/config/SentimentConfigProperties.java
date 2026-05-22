package com.sba302.reminer.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConfigurationProperties(prefix = "app.sentiment")
@Getter
@Setter
public class SentimentConfigProperties {

    private List<String> negativeKeywords = List.of(
            "buồn", "cô đơn", "nhớ", "chán", "tệ", "tức giận", "tuyệt vọng", "đau", "khóc"
    );

    private List<String> positiveKeywords = List.of(
            "ổn", "tốt", "vui", "đỡ hơn", "hạnh phúc", "tuyệt vời", "tự hào", "biết ơn"
    );
}
