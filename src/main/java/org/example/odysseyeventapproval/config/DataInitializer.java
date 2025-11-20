package org.example.odysseyeventapproval.config;

import org.example.odysseyeventapproval.dto.UserCreateRequest;
import org.example.odysseyeventapproval.model.UserRole;
import org.example.odysseyeventapproval.service.UserAdminService;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {
    @Bean
    ApplicationRunner seedDefaults(UserAdminService userAdminService) {
        return args -> {
            createIfMissing(userAdminService, "admin", "Administrator", "admin123", UserRole.ADMIN);
            createIfMissing(userAdminService, "dev", "Developer", "dev123", UserRole.DEV);
            createIfMissing(userAdminService, "student", "Student One", "student123", UserRole.STUDENT);
            createIfMissing(userAdminService, "sa", "SA Office", "sa123", UserRole.SA_OFFICE);
            createIfMissing(userAdminService, "faculty", "Faculty Coordinator", "faculty123", UserRole.FACULTY_COORDINATOR);
            createIfMissing(userAdminService, "dean", "Dean", "dean123", UserRole.DEAN);
        };
    }

    private void createIfMissing(UserAdminService userAdminService, String username, String display, String password, UserRole role) {
        try {
            userAdminService.createUser(build(username, display, password, role));
        } catch (Exception ignored) {
        }
    }

    private UserCreateRequest build(String username, String display, String password, UserRole role) {
        UserCreateRequest request = new UserCreateRequest();
        request.setUsername(username);
        request.setDisplayName(display);
        request.setPassword(password);
        request.setRole(role);
        return request;
    }
}
