package org.example.odysseyeventapproval.repository;

import org.example.odysseyeventapproval.model.DecisionStatus;
import org.example.odysseyeventapproval.model.Event;
import org.example.odysseyeventapproval.model.EventStage;
import org.example.odysseyeventapproval.model.User;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStudentOrderByCreatedAtDesc(User student);

    @Query("SELECT DISTINCT e FROM Event e LEFT JOIN e.subEvents s WHERE e.student = :student OR s.poc = :student ORDER BY e.createdAt DESC")
    List<Event> findAccessibleToStudent(@Param("student") User student);
    List<Event> findByStageOrderByCreatedAtDesc(EventStage stage);

    List<Event> findBySaStatusNot(DecisionStatus status, Sort sort);

    List<Event> findByFacultyStatusNot(DecisionStatus status, Sort sort);

    List<Event> findByDeanStatusNot(DecisionStatus status, Sort sort);
}
