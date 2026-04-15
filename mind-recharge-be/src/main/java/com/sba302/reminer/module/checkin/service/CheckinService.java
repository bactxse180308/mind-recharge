package com.sba302.reminer.module.checkin.service;

import com.sba302.reminer.module.checkin.dto.request.CheckinRequest;
import com.sba302.reminer.module.checkin.dto.response.CheckinResponse;

import java.time.LocalDate;
import java.util.List;

public interface CheckinService {

    CheckinResponse upsertToday(Long userId, CheckinRequest request);

    CheckinResponse getToday(Long userId);

    List<CheckinResponse> getHistory(Long userId, LocalDate from, LocalDate to);
}
