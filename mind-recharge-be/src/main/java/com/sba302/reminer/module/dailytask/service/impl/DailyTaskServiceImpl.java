package com.sba302.reminer.module.dailytask.service.impl;

import com.sba302.reminer.common.exception.AppException;
import com.sba302.reminer.module.dailytask.dto.request.UpdateTaskStatusRequest;
import com.sba302.reminer.module.dailytask.dto.response.DailyTaskResponse;
import com.sba302.reminer.module.dailytask.entity.DailyTaskLog;
import com.sba302.reminer.module.dailytask.entity.DailyTaskTemplate;
import com.sba302.reminer.module.dailytask.repository.DailyTaskLogRepository;
import com.sba302.reminer.module.dailytask.repository.DailyTaskLogSpecification;
import com.sba302.reminer.module.dailytask.repository.DailyTaskTemplateRepository;
import com.sba302.reminer.module.dailytask.service.DailyTaskService;
import com.sba302.reminer.module.user.entity.User;
import com.sba302.reminer.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class DailyTaskServiceImpl implements DailyTaskService {

    private final DailyTaskTemplateRepository templateRepo;
    private final DailyTaskLogRepository logRepo;
    private final UserRepository userRepository;

    @Override
    public List<DailyTaskResponse> getToday(Long userId) {
        User user = findUser(userId);
        LocalDate today = LocalDate.now(resolveZone(user.getTimezone()));
        return buildTaskList(userId, today);
    }

    @Override
    @Transactional
    public DailyTaskResponse updateStatus(Long userId, String taskCode, UpdateTaskStatusRequest request) {
        User user = findUser(userId);
        LocalDate today = LocalDate.now(resolveZone(user.getTimezone()));

        DailyTaskTemplate template = templateRepo.findByCode(taskCode)
                .orElseThrow(() -> AppException.notFound("Task not found: " + taskCode));

        Optional<DailyTaskLog> existing = logRepo.findByUserIdAndTaskTemplateIdAndTaskDate(
                userId, template.getId(), today);

        DailyTaskLog taskLog = existing.orElseGet(() -> DailyTaskLog.builder()
                .user(user)
                .taskTemplate(template)
                .taskDate(today)
                .build());

        taskLog.setIsDone(request.getIsDone());
        taskLog.setDoneAt(Boolean.TRUE.equals(request.getIsDone()) ? Instant.now() : null);
        logRepo.save(taskLog);

        return toResponse(template, taskLog, today);
    }

    @Override
    public List<DailyTaskResponse> getHistory(Long userId, LocalDate from, LocalDate to) {
        List<DailyTaskTemplate> templates = templateRepo.findByIsActiveTrueOrderBySortOrderAsc();
        List<DailyTaskLog> logs = logRepo.findAll(
                DailyTaskLogSpecification.forUserInRange(userId, from, to),
                Sort.by("taskDate").descending()
        );

        Map<String, DailyTaskLog> logMap = logs.stream()
                .collect(Collectors.toMap(
                        l -> l.getTaskDate() + ":" + l.getTaskTemplate().getId(),
                        l -> l
                ));

        return from.datesUntil(to.plusDays(1))
                .flatMap(date -> templates.stream().map(t -> {
                    DailyTaskLog l = logMap.get(date + ":" + t.getId());
                    return toResponse(t, l, date);
                }))
                .toList();
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private List<DailyTaskResponse> buildTaskList(Long userId, LocalDate date) {
        List<DailyTaskTemplate> templates = templateRepo.findByIsActiveTrueOrderBySortOrderAsc();
        List<DailyTaskLog> logs = logRepo.findByUserIdAndTaskDate(userId, date);
        Map<Long, DailyTaskLog> logByTemplateId = logs.stream()
                .collect(Collectors.toMap(l -> l.getTaskTemplate().getId(), l -> l));

        return templates.stream()
                .map(t -> toResponse(t, logByTemplateId.get(t.getId()), date))
                .toList();
    }

    private DailyTaskResponse toResponse(DailyTaskTemplate t, DailyTaskLog l, LocalDate date) {
        boolean done = l != null && Boolean.TRUE.equals(l.getIsDone());
        return DailyTaskResponse.builder()
                .templateId(t.getId())
                .code(t.getCode())
                .title(t.getTitle())
                .emoji(t.getEmoji())
                .sortOrder(t.getSortOrder())
                .taskDate(date)
                .isDone(done)
                .doneAt(l != null ? l.getDoneAt() : null)
                .build();
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User not found"));
    }

    private ZoneId resolveZone(String timezone) {
        try { return ZoneId.of(timezone); } catch (Exception e) { return ZoneId.of("UTC"); }
    }
}
