package com.sba302.reminer.module.bootstrap.controller;

import com.sba302.reminer.common.enums.ContentType;
import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.module.content.entity.ContentItem;
import com.sba302.reminer.module.content.repository.ContentItemRepository;
import com.sba302.reminer.module.dailytask.entity.DailyTaskTemplate;
import com.sba302.reminer.module.dailytask.repository.DailyTaskTemplateRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/bootstrap")
@RequiredArgsConstructor
@Tag(name = "Bootstrap", description = "Initial app configuration payload")
@SecurityRequirement(name = "bearerAuth")
public class BootstrapController {

    private final ContentItemRepository contentRepo;
    private final DailyTaskTemplateRepository taskTemplateRepo;

    @GetMapping
    @Operation(summary = "Get initial app configuration (content + templates)")
    public ApiResponse<BootstrapResponse> bootstrap() {
        List<ContentItem> moodResponses = contentRepo.findByContentTypeAndIsActiveTrueOrderBySortOrderAsc(ContentType.MOOD_RESPONSE);
        List<ContentItem> triggerReminders = contentRepo.findByContentTypeAndIsActiveTrueOrderBySortOrderAsc(ContentType.TRIGGER_REMINDER);
        List<ContentItem> milestoneMessages = contentRepo.findByContentTypeAndIsActiveTrueOrderBySortOrderAsc(ContentType.MILESTONE_MESSAGE);
        List<ContentItem> quotes = contentRepo.findByContentTypeAndIsActiveTrueOrderBySortOrderAsc(ContentType.QUOTE);
        List<ContentItem> microcopies = contentRepo.findByContentTypeAndIsActiveTrueOrderBySortOrderAsc(ContentType.JOURNAL_MICROCOPY);
        List<ContentItem> dailyFeedbacks = contentRepo.findByContentTypeAndIsActiveTrueOrderBySortOrderAsc(ContentType.DAILY_FEEDBACK);
        List<DailyTaskTemplate> taskTemplates = taskTemplateRepo.findByIsActiveTrueOrderBySortOrderAsc();

        BootstrapResponse response = BootstrapResponse.builder()
                .moodOptions(List.of("BAD", "NEUTRAL", "BETTER"))
                .moodResponses(toMap(moodResponses))
                .triggerReminders(toTextList(triggerReminders))
                .milestoneMessages(toMap(milestoneMessages))
                .quotes(toTextList(quotes))
                .journalMicrocopies(toMap(microcopies))
                .dailyFeedbacks(toMap(dailyFeedbacks))
                .taskTemplates(taskTemplates.stream().map(t -> TaskTemplateItem.builder()
                        .id(t.getId()).code(t.getCode()).title(t.getTitle()).emoji(t.getEmoji()).build()).toList())
                .build();

        return ApiResponse.ok(response);
    }

    private Map<String, String> toMap(List<ContentItem> items) {
        return items.stream().collect(Collectors.toMap(ContentItem::getContentKey, ContentItem::getText));
    }

    private List<String> toTextList(List<ContentItem> items) {
        return items.stream().map(ContentItem::getText).toList();
    }

    @Getter @Builder
    public static class BootstrapResponse {
        private List<String> moodOptions;
        private Map<String, String> moodResponses;
        private List<String> triggerReminders;
        private Map<String, String> milestoneMessages;
        private List<String> quotes;
        private Map<String, String> journalMicrocopies;
        private Map<String, String> dailyFeedbacks;
        private List<TaskTemplateItem> taskTemplates;
    }

    @Getter @Builder
    public static class TaskTemplateItem {
        private Long id;
        private String code;
        private String title;
        private String emoji;
    }
}
