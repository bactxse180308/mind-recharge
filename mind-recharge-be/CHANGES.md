# Code Quality Improvements

## 1. Fix `findAll` → `findOne` trong `JournalServiceImpl`

**File:** `module/journal/service/impl/JournalServiceImpl.java`

`getById`, `update`, và `delete` trước đây dùng `findAll(spec).stream().findFirst()` để lấy một bản ghi duy nhất. `JpaSpecificationExecutor` đã có sẵn `findOne(spec)` đúng semantics hơn — chỉ load đúng một record thay vì load danh sách rồi lấy phần tử đầu.

```java
// Trước
journalRepo.findAll(spec).stream().findFirst()

// Sau
journalRepo.findOne(spec)
```

---

## 2. Fix silent exception trong `HealingServiceImpl`

**File:** `module/healing/service/impl/HealingServiceImpl.java`

`handleJournalSavedEvent` catch exception nhưng chỉ log `e.getMessage()` — mất stack trace, khó debug khi healing score bị tính sai trên production.

```java
// Trước
log.error("Failed to process JournalSavedEvent for user {}: {}", event.getUserId(), e.getMessage());

// Sau
log.error("Failed to process JournalSavedEvent for user {}", event.getUserId(), e);
```

---

## 3. Đưa sentiment keyword list ra YAML config

**Files:**
- `common/config/SentimentConfigProperties.java` *(mới)*
- `module/healing/service/impl/RuleBasedSentimentServiceImpl.java`
- `resources/application.yml`

Keyword list trước đây hardcode trong class, thay đổi phải recompile và redeploy. Nay bind qua `@ConfigurationProperties(prefix = "app.sentiment")` — chỉnh sửa keywords bằng cách cập nhật `application.yml` rồi restart service, không cần build lại.

Đồng thời mở rộng keyword list từ 9 negative + 8 positive lên 15 negative + 14 positive để giảm false negative.

---

## 4. Rate limiting cho auth endpoint

**Files:**
- `common/filter/RateLimitFilter.java` *(mới)*
- `common/config/SecurityConfig.java`

`/api/v1/auth/login` và `/api/v1/auth/register` không có giới hạn request, có thể bị brute force. Thêm `RateLimitFilter` — sliding window 10 requests/IP/phút, trả về HTTP 429 khi vượt ngưỡng.

```
POST /api/v1/auth/login (IP: 1.2.3.4) — 11 lần trong 1 phút
→ HTTP 429: {"success": false, "message": "Too many requests. Please try again later."}
```

Filter đặt trước `JwtAuthenticationFilter` trong chain, chỉ active trên `/api/v1/auth/login` và `/api/v1/auth/register`.
