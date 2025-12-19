CREATE TABLE IF NOT EXISTS clubs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

ALTER TABLE sub_events
    ADD COLUMN club_id BIGINT,
    MODIFY COLUMN budget_head DECIMAL(12,2) NOT NULL DEFAULT 0,
    DROP COLUMN budget_breakdown;

CREATE TABLE IF NOT EXISTS budget_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sub_event_id BIGINT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_budget_items_sub_event FOREIGN KEY (sub_event_id) REFERENCES sub_events(id) ON DELETE CASCADE
);

ALTER TABLE sub_events
    ADD CONSTRAINT fk_sub_events_club FOREIGN KEY (club_id) REFERENCES clubs(id);
