package com.sba302.reminer.module.bootstrap.controller;

import com.sba302.reminer.common.enums.ContentType;
import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.module.content.service.ContentCatalogService;
import com.sba302.reminer.module.dailytask.service.DailyTaskTemplateCatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/v1/bootstrap")
@RequiredArgsConstructor
@Tag(name = "Bootstrap", description = "Initial app configuration payload")
@SecurityRequirement(name = "bearerAuth")
public class BootstrapController {

    private final ContentCatalogService contentCatalogService;
    private final DailyTaskTemplateCatalogService taskTemplateCatalogService;

    @GetMapping
    @Operation(summary = "Get initial app configuration (content + templates)")
    public ApiResponse<BootstrapResponse> bootstrap() {
        BootstrapResponse response = BootstrapResponse.builder()
                .moodOptions(List.of("BAD", "NEUTRAL", "BETTER"))
                .moodResponses(contentCatalogService.getTextMap(ContentType.MOOD_RESPONSE))
                .triggerReminders(contentCatalogService.getTextList(ContentType.TRIGGER_REMINDER))
                .milestoneMessages(contentCatalogService.getTextMap(ContentType.MILESTONE_MESSAGE))
                .quotes(contentCatalogService.getTextList(ContentType.QUOTE))
                .journalMicrocopies(contentCatalogService.getTextMap(ContentType.JOURNAL_MICROCOPY))
                .dailyFeedbacks(contentCatalogService.getTextMap(ContentType.DAILY_FEEDBACK))
                .taskTemplates(taskTemplateCatalogService.getActiveTemplates().stream().map(t -> TaskTemplateItem.builder()
                        .id(t.id()).code(t.code()).title(t.title()).emoji(t.emoji()).build()).toList())
                .build();

        return ApiResponse.ok(response);
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
