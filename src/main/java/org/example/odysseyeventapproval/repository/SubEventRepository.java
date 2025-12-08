package org.example.odysseyeventapproval.repository;

import org.example.odysseyeventapproval.model.PocStatus;
import org.example.odysseyeventapproval.model.SubEvent;
import org.example.odysseyeventapproval.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubEventRepository extends JpaRepository<SubEvent, Long> {
    List<SubEvent> findByPocAndPocStatus(User poc, PocStatus pocStatus);
}
