package com.numia.surveys.repository;

import com.numia.surveys.model.QuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionOptionRepository extends JpaRepository<QuestionOption, Long> {
    
    List<QuestionOption> findByQuestionIdOrderByOrderIndexAsc(Long questionId);
    
    List<QuestionOption> findByQuestionId(Long questionId);
    
    @Query("SELECT MAX(o.orderIndex) FROM QuestionOption o WHERE o.question.id = :questionId")
    Integer findMaxOrderIndexByQuestionId(Long questionId);
    
    void deleteByQuestionId(Long questionId);
}

