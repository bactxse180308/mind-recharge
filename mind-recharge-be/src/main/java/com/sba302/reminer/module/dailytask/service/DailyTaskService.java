package com.sba302.reminer.module.dailytask.service;

import com.sba302.reminer.module.dailytask.dto.request.UpdateTaskStatusRequest;
import com.sba302.reminer.module.dailytask.dto.response.DailyTaskResponse;

import java.time.LocalDate;
import java.util.List;

public interface DailyTaskService {

    List<DailyTaskResponse> getToday(Long userId);

    DailyTaskResponse updateStatus(Long userId, String taskCode, UpdateTaskStatusRequest request);

    List<DailyTaskResponse> getHistory(Long userId, LocalDate from, LocalDate to);
}
