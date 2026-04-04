---
trigger: always_on
---

---

## trigger: manual

# Spring Boot 3 Code Style Guide

## 1. Cấu Trúc Package

```
com.company.project
├── config/            # Spring & Application Configurations
├── controller/        # REST Controllers (API Layer)
├── dto/               # Request / Response DTOs
│   ├── request/
│   └── response/
├── entity/            # JPA Entities (Domain Model)
├── repository/        # Spring Data Repositories
├── service/           # Business Logic Interfaces (Use Cases)
│   └── impl/          # Business Logic Implementations
├── exception/         # Custom Exceptions & Global Handler
└── mapper/            # Entity <-> DTO Mappers (MapStruct)
```

## 2. Naming Conventions

- **Entity**: `User`, `Product`
- **Repository**: `UserRepository`
- **Service**: `UserService`,
- **Service/Impl** `UserServiceImpl`
- **Controller**: `UserController`
- **DTO**: `CreateUserRequest`, `UserResponse`
- **Exception**: `UserNotFoundException`
- **Constants**: `UPPER_SNAKE_CASE`
- **Variables**: `camelCase`

## 3. Entity Pattern

```java
@Entity
@Table(name = "users")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    private UserStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id")
    private Role role;
}
```

## 4. Repository Layer

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.status = :status")
    Page<User> findByStatus(@Param("status") UserStatus status, Pageable pageable);
}
```

## 5. Service Pattern

```java
5.1 Service Interface (service/)
package com.company.project.service;

public interface UserService {

    UserResponse createUser(CreateUserRequest request);

    UserResponse getUserById(Long id);

    Page<UserResponse> getAllUsers(Pageable pageable);
}
✅ Không @Service
✅ Không @Transactional
✅ Không chứa logic
✅ Đóng vai trò Use Case / Contract

5.2 Service Implementation (service/impl/)
package com.company.project.service.impl;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Override
    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public UserResponse createUser(CreateUserRequest request) {

        log.info("Creating user with email={}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException("Email already exists");
        }

        User user = userMapper.toEntity(request);
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Cacheable(value = "users", key = "#id")
    public UserResponse getUserById(Long id) {
        return userRepository.findById(id)
            .map(userMapper::toResponse)
            .orElseThrow(() ->
                new UserNotFoundException("User not found: " + id)
            );
    }

    @Override
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
            .map(userMapper::toResponse);
    }
}


📌 Note

Impl có thể để package-private (không public) → ẩn implementation

@Transactional, @Cache, @Async chỉ đặt ở Impl

```

## 6. Controller Pattern

```java
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    private final UserService userService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        return ApiResponse.success(userService.createUser(request));
    }

    @GetMapping("/{id}")
    public ApiResponse<UserResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(userService.getUserById(id));
    }

    @GetMapping
    public ApiResponse<Page<UserResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id,desc") String[] sort) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(parseSort(sort)));
        return ApiResponse.success(userService.getAllUsers(pageable));
    }
}
❌ Không inject UserServiceImpl
```

## 7. DTO Pattern

```java
// Request DTO
@Getter @Setter
public class CreateUserRequest {
    @NotBlank @Email
    private String email;

    @NotBlank @Size(min = 2, max = 100)
    private String fullName;

    @NotBlank @Size(min = 8)
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).*$")
    private String password;
}

// Response DTO
@Getter @Setter @Builder
public class UserResponse {
    private Long id;
    private String email;
    private String fullName;
    private UserStatus status;
    private LocalDateTime createdAt;
}
```

## 8. Exception Handling

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<Void> handleNotFound(UserNotFoundException ex) {
        log.error("Not found: {}", ex.getMessage());
        return ApiResponse.error(404, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
            .forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
        return ApiResponse.error(400, "Validation failed", errors);
    }
}
```

## 9. Caching Configuration

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("users", "products");
    }
}

// Usage in Service
@Cacheable(value = "users", key = "#id")
@CachePut(value = "users", key = "#result.id")
@CacheEvict(value = "users", allEntries = true)
```

## 10. Async Processing

```java
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("async-");
        executor.initialize();
        return executor;
    }
}

// Usage
@Async
public CompletableFuture<Void> sendEmailAsync(String email) {
    log.info("Sending email to: {}", email);
    // Send email logic
    return CompletableFuture.completedFuture(null);
}
```

## 11. Pagination Helper

```java
// Pageable request
PageRequest.of(page, size, Sort.by("createdAt").descending())

// Page response wrapper
@Getter @Builder
public class PageResponse<T> {
    private List<T> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private boolean last;
}
```

## 12. API Response Wrapper

```java
@Getter @Builder
public class ApiResponse<T> {
    private int status;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
            .status(200)
            .message("Success")
            .data(data)
            .timestamp(LocalDateTime.now())
            .build();
    }

    public static <T> ApiResponse<T> error(int status, String message) {
        return ApiResponse.<T>builder()
            .status(status)
            .message(message)
            .timestamp(LocalDateTime.now())
            .build();
    }
}
```

## 13. Configuration Properties

```yaml
spring:
  jpa:
    hibernate.ddl-auto: validate
    show-sql: false

  datasource:
    url:
    username: ${DB_USER:postgres}
    password: ${DB_PASS:password}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5

  cache:
    type: simple

  task:
    execution:
      pool:
        core-size: 5
        max-size: 10

logging.level:
  root: INFO
  com.company.project: DEBUG
```

## 16. Best Practices Checklist

✅ service/ chỉ chứa interface (Use Case)
✅ service/impl/ chỉ chứa implementation
✅ Controller chỉ inject Service interface
✅ Interface không có Spring annotation
✅ @Service, @Transactional, @Cache chỉ đặt ở Impl
✅ @Transactional(readOnly = true) cho read methods
✅ Validate input bằng @Valid + Bean Validation
✅ Không return null – dùng Optional / Exception
✅ Custom Exception có message rõ nghĩa
✅ Pagination cho list APIs
✅ Cache cho read-heavy APIs
✅ Async cho long-running tasks
✅ Constants thay magic numbers/strings
✅ Unit Test dễ mock Service interface
