package org.example.odysseyeventapproval.repository;

import org.example.odysseyeventapproval.model.Event;
import org.example.odysseyeventapproval.model.EventStage;
import org.example.odysseyeventapproval.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStudent(User student);
    List<Event> findByStage(EventStage stage);
}
