package com.numia.surveys.service;

import com.numia.surveys.dto.survey.*;
import com.numia.surveys.model.*;
import com.numia.surveys.model.enums.SurveyStatus;
import com.numia.surveys.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SurveyService {
    
    private final SurveyRepository surveyRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    
    @Value("${survey.base-url}")
    private String surveyBaseUrl;
    
    public SurveyService(SurveyRepository surveyRepository, QuestionRepository questionRepository,
                         QuestionOptionRepository questionOptionRepository, CompanyRepository companyRepository,
                         UserRepository userRepository) {
        this.surveyRepository = surveyRepository;
        this.questionRepository = questionRepository;
        this.questionOptionRepository = questionOptionRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }
    
    @Transactional
    public SurveyDTO createSurvey(CreateSurveyRequest request, Long companyId, Long userId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Compañía no encontrada"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        int currentSurveys = surveyRepository.countByCompanyId(companyId);
        if (currentSurveys >= company.getMaxSurveys()) {
            throw new RuntimeException("Has alcanzado el límite de encuestas para tu plan");
        }
        
        Survey survey = Survey.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(SurveyStatus.DRAFT)
                .allowAnonymous(request.getAllowAnonymous())
                .showProgressBar(request.getShowProgressBar())
                .allowBackNavigation(request.getAllowBackNavigation())
                .randomizeQuestions(request.getRandomizeQuestions())
                .oneQuestionPerPage(request.getOneQuestionPerPage())
                .requireLogin(request.getRequireLogin())
                .responseLimit(request.getResponseLimit())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .logoUrl(request.getLogoUrl())
                .primaryColor(request.getPrimaryColor())
                .backgroundColor(request.getBackgroundColor())
                .welcomeMessage(request.getWelcomeMessage())
                .thankYouMessage(request.getThankYouMessage())
                .redirectUrl(request.getRedirectUrl())
                .customCss(request.getCustomCss())
                .language(request.getLanguage())
                .company(company)
                .createdBy(user)
                .build();
        
        survey = surveyRepository.save(survey);
        
        if (request.getQuestions() != null && !request.getQuestions().isEmpty()) {
            Survey finalSurvey = survey;
            int orderIndex = 0;
            for (CreateQuestionRequest qRequest : request.getQuestions()) {
                addQuestionToSurvey(finalSurvey, qRequest, orderIndex++);
            }
        }
        
        SurveyDTO dto = SurveyDTO.fromEntity(survey, true);
        dto.setSurveyUrl(surveyBaseUrl + "/" + survey.getPublicId());
        return dto;
    }
    
    public SurveyDTO getSurvey(Long surveyId, Long companyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));
        
        if (!survey.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta encuesta");
        }
        
        SurveyDTO dto = SurveyDTO.fromEntity(survey, true);
        dto.setSurveyUrl(surveyBaseUrl + "/" + survey.getPublicId());
        return dto;
    }
    
    public SurveyDTO getPublicSurvey(String publicId) {
        Survey survey = surveyRepository.findByPublicId(publicId)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));
        
        if (survey.getStatus() != SurveyStatus.ACTIVE) {
            throw new RuntimeException("Esta encuesta no está disponible");
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
        
        return SurveyDTO.fromEntity(survey, true);
    }
    
    public List<SurveyDTO> getSurveysByCompany(Long companyId) {
        return surveyRepository.findByCompanyIdOrderByUpdatedAtDesc(companyId).stream()
                .map(s -> {
                    SurveyDTO dto = SurveyDTO.fromEntity(s, false);
                    dto.setSurveyUrl(surveyBaseUrl + "/" + s.getPublicId());
                    return dto;
                })
                .collect(Collectors.toList());
    }
    
    @Transactional
    public SurveyDTO updateSurvey(Long surveyId, CreateSurveyRequest request, Long companyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));
        
        if (!survey.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta encuesta");
        }
        
        survey.setTitle(request.getTitle());
        survey.setDescription(request.getDescription());
        survey.setAllowAnonymous(request.getAllowAnonymous());
        survey.setShowProgressBar(request.getShowProgressBar());
        survey.setAllowBackNavigation(request.getAllowBackNavigation());
        survey.setRandomizeQuestions(request.getRandomizeQuestions());
        survey.setOneQuestionPerPage(request.getOneQuestionPerPage());
        survey.setRequireLogin(request.getRequireLogin());
        survey.setResponseLimit(request.getResponseLimit());
        survey.setStartDate(request.getStartDate());
        survey.setEndDate(request.getEndDate());
        survey.setLogoUrl(request.getLogoUrl());
        survey.setPrimaryColor(request.getPrimaryColor());
        survey.setBackgroundColor(request.getBackgroundColor());
        survey.setWelcomeMessage(request.getWelcomeMessage());
        survey.setThankYouMessage(request.getThankYouMessage());
        survey.setRedirectUrl(request.getRedirectUrl());
        survey.setCustomCss(request.getCustomCss());
        survey.setLanguage(request.getLanguage());
        
        survey = surveyRepository.save(survey);
        
        SurveyDTO dto = SurveyDTO.fromEntity(survey, true);
        dto.setSurveyUrl(surveyBaseUrl + "/" + survey.getPublicId());
        return dto;
    }
    
    @Transactional
    public SurveyDTO publishSurvey(Long surveyId, Long companyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));
        
        if (!survey.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta encuesta");
        }
        
        if (survey.getQuestions().isEmpty()) {
            throw new RuntimeException("La encuesta debe tener al menos una pregunta");
        }
        
        survey.publish();
        survey = surveyRepository.save(survey);
        
        SurveyDTO dto = SurveyDTO.fromEntity(survey, true);
        dto.setSurveyUrl(surveyBaseUrl + "/" + survey.getPublicId());
        return dto;
    }
    
    @Transactional
    public SurveyDTO closeSurvey(Long surveyId, Long companyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));
        
        if (!survey.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta encuesta");
        }
        
        survey.close();
        survey = surveyRepository.save(survey);
        
        return SurveyDTO.fromEntity(survey, true);
    }
    
    @Transactional
    public QuestionDTO addQuestion(Long surveyId, CreateQuestionRequest request, Long companyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));
        
        if (!survey.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta encuesta");
        }
        
        int orderIndex = request.getOrderIndex() != null ? 
                request.getOrderIndex() : 
                questionRepository.findMaxOrderIndexBySurveyId(surveyId).orElse(-1) + 1;
        
        Question question = addQuestionToSurvey(survey, request, orderIndex);
        return QuestionDTO.fromEntity(question);
    }
    
    private Question addQuestionToSurvey(Survey survey, CreateQuestionRequest request, int orderIndex) {
        Question question = Question.builder()
                .text(request.getText())
                .description(request.getDescription())
                .type(request.getType())
                .orderIndex(orderIndex)
                .required(request.getRequired())
                .minLength(request.getMinLength())
                .maxLength(request.getMaxLength())
                .minValue(request.getMinValue())
                .maxValue(request.getMaxValue())
                .validationRegex(request.getValidationRegex())
                .validationMessage(request.getValidationMessage())
                .scaleMin(request.getScaleMin())
                .scaleMax(request.getScaleMax())
                .scaleMinLabel(request.getScaleMinLabel())
                .scaleMaxLabel(request.getScaleMaxLabel())
                .placeholder(request.getPlaceholder())
                .imageUrl(request.getImageUrl())
                .randomizeOptions(request.getRandomizeOptions())
                .showOtherOption(request.getShowOtherOption())
                .displayLogic(request.getDisplayLogic())
                .skipLogic(request.getSkipLogic())
                .matrixRows(request.getMatrixRows())
                .survey(survey)
                .build();
        
        question = questionRepository.save(question);
        
        if (request.getOptions() != null && !request.getOptions().isEmpty()) {
            Question finalQuestion = question;
            int optionIndex = 0;
            for (CreateQuestionOptionRequest optRequest : request.getOptions()) {
                QuestionOption option = QuestionOption.builder()
                        .text(optRequest.getText())
                        .value(optRequest.getValue())
                        .orderIndex(optionIndex++)
                        .imageUrl(optRequest.getImageUrl())
                        .score(optRequest.getScore())
                        .exclusive(optRequest.getExclusive())
                        .question(finalQuestion)
                        .build();
                questionOptionRepository.save(option);
            }
        }
        
        return question;
    }
    
    @Transactional
    public QuestionDTO updateQuestion(Long questionId, CreateQuestionRequest request, Long companyId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Pregunta no encontrada"));
        
        if (!question.getSurvey().getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta pregunta");
        }
        
        question.setText(request.getText());
        question.setDescription(request.getDescription());
        question.setType(request.getType());
        question.setRequired(request.getRequired());
        question.setMinLength(request.getMinLength());
        question.setMaxLength(request.getMaxLength());
        question.setMinValue(request.getMinValue());
        question.setMaxValue(request.getMaxValue());
        question.setValidationRegex(request.getValidationRegex());
        question.setValidationMessage(request.getValidationMessage());
        question.setScaleMin(request.getScaleMin());
        question.setScaleMax(request.getScaleMax());
        question.setScaleMinLabel(request.getScaleMinLabel());
        question.setScaleMaxLabel(request.getScaleMaxLabel());
        question.setPlaceholder(request.getPlaceholder());
        question.setImageUrl(request.getImageUrl());
        question.setRandomizeOptions(request.getRandomizeOptions());
        question.setShowOtherOption(request.getShowOtherOption());
        question.setDisplayLogic(request.getDisplayLogic());
        question.setSkipLogic(request.getSkipLogic());
        question.setMatrixRows(request.getMatrixRows());
        
        if (request.getOptions() != null) {
            questionOptionRepository.deleteByQuestionId(questionId);
            int optionIndex = 0;
            for (CreateQuestionOptionRequest optRequest : request.getOptions()) {
                QuestionOption option = QuestionOption.builder()
                        .text(optRequest.getText())
                        .value(optRequest.getValue())
                        .orderIndex(optionIndex++)
                        .imageUrl(optRequest.getImageUrl())
                        .score(optRequest.getScore())
                        .exclusive(optRequest.getExclusive())
                        .question(question)
                        .build();
                questionOptionRepository.save(option);
            }
        }
        
        question = questionRepository.save(question);
        return QuestionDTO.fromEntity(question);
    }
    
    @Transactional
    public void deleteQuestion(Long questionId, Long companyId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Pregunta no encontrada"));
        
        if (!question.getSurvey().getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta pregunta");
        }
        
        int removedIndex = question.getOrderIndex();
        Long surveyId = question.getSurvey().getId();
        
        questionRepository.delete(question);
        questionRepository.decrementOrderIndexAfter(surveyId, removedIndex);
    }
    
    @Transactional
    public void reorderQuestions(Long surveyId, List<Long> questionIds, Long companyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));
        
        if (!survey.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta encuesta");
        }
        
        for (int i = 0; i < questionIds.size(); i++) {
            Question question = questionRepository.findById(questionIds.get(i))
                    .orElseThrow(() -> new RuntimeException("Pregunta no encontrada"));
            question.setOrderIndex(i);
            questionRepository.save(question);
        }
    }
    
    @Transactional
    public void deleteSurvey(Long surveyId, Long companyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));
        
        if (!survey.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta encuesta");
        }
        
        surveyRepository.delete(survey);
    }
}
