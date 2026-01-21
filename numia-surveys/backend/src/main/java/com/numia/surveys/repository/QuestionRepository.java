package com.numia.surveys.repository;

import com.numia.surveys.model.Question;
import com.numia.surveys.model.enums.QuestionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    
    List<Question> findBySurveyIdOrderByOrderIndexAsc(Long surveyId);
    
    List<Question> findBySurveyId(Long surveyId);
    
    Optional<Question> findBySurveyIdAndOrderIndex(Long surveyId, Integer orderIndex);
    
    List<Question> findBySurveyIdAndType(Long surveyId, QuestionType type);
    
    @Query("SELECT MAX(q.orderIndex) FROM Question q WHERE q.survey.id = :surveyId")
    Optional<Integer> findMaxOrderIndexBySurveyId(Long surveyId);
    
    @Query("SELECT COUNT(q) FROM Question q WHERE q.survey.id = :surveyId")
    int countBySurveyId(Long surveyId);
    
    @Modifying
    @Query("UPDATE Question q SET q.orderIndex = q.orderIndex + 1 WHERE q.survey.id = :surveyId AND q.orderIndex >= :startIndex")
    void incrementOrderIndexFrom(Long surveyId, Integer startIndex);
    
    @Modifying
    @Query("UPDATE Question q SET q.orderIndex = q.orderIndex - 1 WHERE q.survey.id = :surveyId AND q.orderIndex > :removedIndex")
    void decrementOrderIndexAfter(Long surveyId, Integer removedIndex);
}

