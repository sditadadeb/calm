package com.numia.surveys.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.numia.surveys.dto.response.SubmitResponseRequest;
import com.numia.surveys.dto.response.SurveyResponseDTO;
import com.numia.surveys.model.*;
import com.numia.surveys.model.enums.SurveyStatus;
import com.numia.surveys.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ResponseService {
    
    private final SurveyRepository surveyRepository;
    private final SurveyResponseRepository surveyResponseRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final ContactRepository contactRepository;
    private final ObjectMapper objectMapper;
    
    public ResponseService(SurveyRepository surveyRepository, SurveyResponseRepository surveyResponseRepository,
                           QuestionRepository questionRepository, AnswerRepository answerRepository,
                           ContactRepository contactRepository, ObjectMapper objectMapper) {
        this.surveyRepository = surveyRepository;
        this.surveyResponseRepository = surveyResponseRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.contactRepository = contactRepository;
        this.objectMapper = objectMapper;
    }
    
    @Transactional
    public SurveyResponseDTO submitResponse(String publicId, SubmitResponseRequest request, String ipAddress, String userAgent) {
        Survey survey = surveyRepository.findByPublicId(publicId)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));
        
        if (survey.getStatus() != SurveyStatus.ACTIVE) {
            throw new RuntimeException("Esta encuesta no está activa");
        }
        
        LocalDateTime now = LocalDateTime.now();
        if (survey.getStartDate() != null && now.isBefore(survey.getStartDate())) {
            throw new RuntimeException("Esta encuesta aún no está disponible");
        }
        if (survey.getEndDate() != null && now.isAfter(survey.getEndDate())) {
            throw new RuntimeException("Esta encuesta ha finalizado");
        }
        if (survey.getResponseLimit() > 0 && survey.getTotalResponses() >= survey.getResponseLimit()) {
            throw new RuntimeException("Esta encuesta ha alcanzado el límite de respuestas");
        }
        
        SurveyResponse response = SurveyResponse.builder()
                .survey(survey)
                .respondentEmail(request.getRespondentEmail())
                .respondentName(request.getRespondentName())
                .respondentPhone(request.getRespondentPhone())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .totalQuestions(survey.getQuestions().size())
                .build();
        
        if (request.getMetadata() != null) {
            try {
                response.setMetadata(objectMapper.writeValueAsString(request.getMetadata()));
            } catch (Exception e) {
                // Ignore
            }
        }
        
        response = surveyResponseRepository.save(response);
        
        int completedQuestions = 0;
        if (request.getAnswers() != null) {
            for (SubmitResponseRequest.AnswerRequest answerRequest : request.getAnswers()) {
                Question question = questionRepository.findById(answerRequest.getQuestionId())
                        .orElseThrow(() -> new RuntimeException("Pregunta no encontrada: " + answerRequest.getQuestionId()));
                
                Answer answer = Answer.builder()
                        .surveyResponse(response)
                        .question(question)
                        .textValue(answerRequest.getTextValue())
                        .numericValue(answerRequest.getNumericValue())
                        .matrixRow(answerRequest.getMatrixRow())
                        .fileUrl(answerRequest.getFileUrl())
                        .build();
                
                if (answerRequest.getSelectedOptionIds() != null && !answerRequest.getSelectedOptionIds().isEmpty()) {
                    answer.setSelectedOptionIds(
                            answerRequest.getSelectedOptionIds().stream()
                                    .map(String::valueOf)
                                    .collect(Collectors.joining(","))
                    );
                }
                
                answerRepository.save(answer);
                completedQuestions++;
            }
        }
        
        response.setCompletedQuestions(completedQuestions);
        response.markCompleted();
        response = surveyResponseRepository.save(response);
        
        survey.setTotalResponses(survey.getTotalResponses() + 1);
        survey.setCompletedResponses(survey.getCompletedResponses() + 1);
        
        Double avgTime = surveyResponseRepository.getAverageCompletionTimeBySurveyId(survey.getId());
        survey.setAverageCompletionTime(avgTime);
        
        int total = survey.getTotalResponses();
        int completed = survey.getCompletedResponses();
        survey.setCompletionRate(total > 0 ? (completed * 100.0) / total : 0.0);
        
        surveyRepository.save(survey);
        
        return SurveyResponseDTO.fromEntity(response, true);
    }
    
    public List<SurveyResponseDTO> getResponsesBySurvey(Long surveyId, Long companyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));
        
        if (!survey.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta encuesta");
        }
        
        return surveyResponseRepository.findBySurveyId(surveyId).stream()
                .map(r -> SurveyResponseDTO.fromEntity(r, false))
                .collect(Collectors.toList());
    }
    
    public Page<SurveyResponseDTO> getResponsesBySurveyPaginated(Long surveyId, Long companyId, Pageable pageable) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));
        
        if (!survey.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta encuesta");
        }
        
        return surveyResponseRepository.findBySurveyId(surveyId, pageable)
                .map(r -> SurveyResponseDTO.fromEntity(r, false));
    }
    
    public SurveyResponseDTO getResponseDetail(Long responseId, Long companyId) {
        SurveyResponse response = surveyResponseRepository.findById(responseId)
                .orElseThrow(() -> new RuntimeException("Respuesta no encontrada"));
        
        if (!response.getSurvey().getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta respuesta");
        }
        
        return SurveyResponseDTO.fromEntity(response, true);
    }
    
    @Transactional
    public void deleteResponse(Long responseId, Long companyId) {
        SurveyResponse response = surveyResponseRepository.findById(responseId)
                .orElseThrow(() -> new RuntimeException("Respuesta no encontrada"));
        
        if (!response.getSurvey().getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta respuesta");
        }
        
        Survey survey = response.getSurvey();
        
        surveyResponseRepository.delete(response);
        
        survey.setTotalResponses(Math.max(0, survey.getTotalResponses() - 1));
        if (response.getCompleted()) {
            survey.setCompletedResponses(Math.max(0, survey.getCompletedResponses() - 1));
        }
        surveyRepository.save(survey);
    }
}
