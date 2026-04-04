-- V4__create_daily_tasks_and_trigger.sql

-- ===== DAILY TASK TEMPLATES =====
CREATE TABLE daily_task_templates
(
    id         BIGSERIAL    NOT NULL PRIMARY KEY,
    code       VARCHAR(80)  NOT NULL UNIQUE,
    title      VARCHAR(200) NOT NULL,
    emoji      VARCHAR(10)  NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_task_template_active ON daily_task_templates (is_active, sort_order);

-- ===== DAILY TASK LOGS =====
CREATE TABLE daily_task_logs
(
    id               BIGSERIAL                NOT NULL PRIMARY KEY,
    user_id          BIGINT                   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    task_template_id BIGINT                   NOT NULL REFERENCES daily_task_templates (id),
    task_date        DATE                     NOT NULL,
    is_done          BOOLEAN                  NOT NULL DEFAULT FALSE,
    done_at          TIMESTAMP WITH TIME ZONE,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT uq_task_log_user_template_date UNIQUE (user_id, task_template_id, task_date)
);

CREATE INDEX idx_task_log_user_date ON daily_task_logs (user_id, task_date);

-- ===== EMOTIONAL TRIGGER SESSIONS =====
CREATE TABLE emotional_trigger_sessions
(
    id               BIGSERIAL                NOT NULL PRIMARY KEY,
    user_id          BIGINT                   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    duration_seconds INT                      NOT NULL DEFAULT 600,
    status           VARCHAR(30)              NOT NULL DEFAULT 'RUNNING'
        CONSTRAINT chk_trigger_status CHECK (
            status IN ('RUNNING', 'COMPLETED', 'CANCELLED', 'REDIRECTED_TO_UNSENT')
        ),
    started_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ended_at         TIMESTAMP WITH TIME ZONE,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_trigger_user_id ON emotional_trigger_sessions (user_id);
CREATE INDEX idx_trigger_status ON emotional_trigger_sessions (user_id, status);
