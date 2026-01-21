package com.numia.surveys.repository;

import com.numia.surveys.model.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {
    
    List<Answer> findBySurveyResponseId(Long surveyResponseId);
    
    List<Answer> findByQuestionId(Long questionId);
    
    @Query("SELECT a FROM Answer a WHERE a.surveyResponse.survey.id = :surveyId AND a.question.id = :questionId")
    List<Answer> findBySurveyIdAndQuestionId(Long surveyId, Long questionId);
    
    // For statistics
    @Query("SELECT a.selectedOptionIds, COUNT(a) FROM Answer a " +
           "WHERE a.question.id = :questionId GROUP BY a.selectedOptionIds")
    List<Object[]> countBySelectedOptionForQuestion(Long questionId);
    
    @Query("SELECT AVG(a.numericValue) FROM Answer a WHERE a.question.id = :questionId")
    Double getAverageNumericValueByQuestionId(Long questionId);
    
    @Query("SELECT MIN(a.numericValue), MAX(a.numericValue), AVG(a.numericValue) FROM Answer a " +
           "WHERE a.question.id = :questionId")
    Object[] getNumericStatsByQuestionId(Long questionId);
    
    @Query("SELECT a.numericValue, COUNT(a) FROM Answer a " +
           "WHERE a.question.id = :questionId GROUP BY a.numericValue ORDER BY a.numericValue")
    List<Object[]> getNumericDistributionByQuestionId(Long questionId);
    
    @Query("SELECT a.textValue FROM Answer a WHERE a.question.id = :questionId AND a.textValue IS NOT NULL")
    List<String> getTextResponsesByQuestionId(Long questionId);
}

