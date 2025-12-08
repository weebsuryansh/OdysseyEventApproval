package org.example.odysseyeventapproval.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Ensures the {@code events.stage} column can hold the full enum value when using MySQL,
 * avoiding the "Data truncated for column 'stage'" error without requiring Flyway.
 */
@Component
public class StageColumnAdjuster {
    private static final Logger log = LoggerFactory.getLogger(StageColumnAdjuster.class);
    private final DataSource dataSource;

    public StageColumnAdjuster(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    public void ensureStageColumnSize() {
        try (Connection connection = dataSource.getConnection()) {
            String productName = connection.getMetaData().getDatabaseProductName();
            if (!productName.toLowerCase().contains("mysql")) {
                return; // Only adjust when running against MySQL.
            }

            if (isStageColumnWideEnough(connection)) {
                return;
            }

            try (Statement statement = connection.createStatement()) {
                statement.executeUpdate("ALTER TABLE events MODIFY stage VARCHAR(32) NOT NULL");
                log.info("Adjusted events.stage column to VARCHAR(32) to prevent truncation.");
            } catch (SQLException ex) {
                log.warn("Unable to adjust events.stage column: {}", ex.getMessage());
            }
        } catch (SQLException ex) {
            log.debug("Skipping stage column adjustment: {}", ex.getMessage());
        }
    }

    private boolean isStageColumnWideEnough(Connection connection) throws SQLException {
        String sql = """
                SELECT CHARACTER_MAXIMUM_LENGTH
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'events'
                  AND COLUMN_NAME = 'stage'
                """;

        try (PreparedStatement preparedStatement = connection.prepareStatement(sql)) {
            try (ResultSet resultSet = preparedStatement.executeQuery()) {
                if (resultSet.next()) {
                    long length = resultSet.getLong(1);
                    return length >= 32;
                }
            }
        }
        return false;
    }
}

