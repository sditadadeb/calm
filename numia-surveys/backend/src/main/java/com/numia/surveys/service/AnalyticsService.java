package com.numia.surveys.service;

import com.numia.surveys.dto.metrics.DashboardMetricsDTO;
import com.numia.surveys.dto.metrics.SurveyAnalyticsDTO;
import com.numia.surveys.model.Question;
import com.numia.surveys.model.Survey;
import com.numia.surveys.model.enums.QuestionType;
import com.numia.surveys.model.enums.SurveyStatus;
import com.numia.surveys.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {
    
    private final SurveyRepository surveyRepository;
    private final SurveyResponseRepository surveyResponseRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final DistributionRepository distributionRepository;
    
    public AnalyticsService(SurveyRepository surveyRepository, SurveyResponseRepository surveyResponseRepository,
                            QuestionRepository questionRepository, AnswerRepository answerRepository,
                            DistributionRepository distributionRepository) {
        this.surveyRepository = surveyRepository;
        this.surveyResponseRepository = surveyResponseRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.distributionRepository = distributionRepository;
    }
    
    public DashboardMetricsDTO getDashboardMetrics(Long companyId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        
        List<Survey> surveys = surveyRepository.findByCompanyId(companyId);
        
        int totalSurveys = surveys.size();
        int activeSurveys = (int) surveys.stream()
                .filter(s -> s.getStatus() == SurveyStatus.ACTIVE)
                .count();
        
        int totalResponses = surveys.stream()
                .mapToInt(Survey::getTotalResponses)
                .sum();
        
        int responsesThisMonth = surveyResponseRepository.countByCompanyIdAndDateRange(companyId, startOfMonth, now);
        
        double avgCompletionRate = surveys.stream()
                .filter(s -> s.getCompletionRate() != null)
                .mapToDouble(Survey::getCompletionRate)
                .average()
                .orElse(0.0);
        
        double avgResponseTime = surveys.stream()
                .filter(s -> s.getAverageCompletionTime() != null)
                .mapToDouble(Survey::getAverageCompletionTime)
                .average()
                .orElse(0.0);
        
        Double overallNps = null;
        int promoters = 0, passives = 0, detractors = 0;
        
        for (Survey survey : surveys) {
            List<Double> npsScores = surveyResponseRepository.getNpsScoresBySurveyId(survey.getId());
            if (!npsScores.isEmpty()) {
                for (Double score : npsScores) {
                    if (score >= 9) promoters++;
                    else if (score >= 7) passives++;
                    else detractors++;
                }
            }
        }
        
        int totalNpsResponses = promoters + passives + detractors;
        if (totalNpsResponses > 0) {
            overallNps = ((promoters - detractors) * 100.0) / totalNpsResponses;
        }
        
        List<DashboardMetricsDTO.DailyResponseCount> responseTrend = new ArrayList<>();
        
        List<DashboardMetricsDTO.SurveySummary> topSurveys = surveys.stream()
                .sorted((a, b) -> Integer.compare(b.getTotalResponses(), a.getTotalResponses()))
                .limit(5)
                .map(s -> {
                    DashboardMetricsDTO.SurveySummary summary = new DashboardMetricsDTO.SurveySummary();
                    summary.setId(s.getId());
                    summary.setTitle(s.getTitle());
                    summary.setStatus(s.getStatus().name());
                    summary.setResponses(s.getTotalResponses());
                    summary.setCompletionRate(s.getCompletionRate());
                    return summary;
                })
                .collect(Collectors.toList());
        
        var distributions = distributionRepository.findByCompanyId(companyId);
        int totalDistributions = distributions.size();
        int emailsSent = distributions.stream()
                .filter(d -> d.getChannel() == com.numia.surveys.model.enums.DistributionChannel.EMAIL)
                .mapToInt(d -> d.getSentCount() != null ? d.getSentCount() : 0)
                .sum();
        int smsSent = distributions.stream()
                .filter(d -> d.getChannel() == com.numia.surveys.model.enums.DistributionChannel.SMS)
                .mapToInt(d -> d.getSentCount() != null ? d.getSentCount() : 0)
                .sum();
        
        double avgOpenRate = distributions.stream()
                .filter(d -> d.getSentCount() != null && d.getSentCount() > 0)
                .mapToDouble(d -> (d.getOpenedCount() != null ? d.getOpenedCount() : 0) * 100.0 / d.getSentCount())
                .average()
                .orElse(0.0);
        
        double avgResponseRate = distributions.stream()
                .filter(d -> d.getSentCount() != null && d.getSentCount() > 0)
                .mapToDouble(d -> (d.getRespondedCount() != null ? d.getRespondedCount() : 0) * 100.0 / d.getSentCount())
                .average()
                .orElse(0.0);
        
        DashboardMetricsDTO dto = new DashboardMetricsDTO();
        dto.setTotalSurveys(totalSurveys);
        dto.setActiveSurveys(activeSurveys);
        dto.setTotalResponses(totalResponses);
        dto.setResponsesThisMonth(responsesThisMonth);
        dto.setAverageCompletionRate(avgCompletionRate);
        dto.setAverageResponseTime(avgResponseTime);
        dto.setOverallNps(overallNps);
        dto.setPromoters(promoters);
        dto.setPassives(passives);
        dto.setDetractors(detractors);
        dto.setResponseTrend(responseTrend);
        dto.setTopSurveys(topSurveys);
        dto.setTotalDistributions(totalDistributions);
        dto.setEmailsSent(emailsSent);
        dto.setSmsSent(smsSent);
        dto.setAverageOpenRate(avgOpenRate);
        dto.setAverageResponseRate(avgResponseRate);
        return dto;
    }
    
    public SurveyAnalyticsDTO getSurveyAnalytics(Long surveyId, Long companyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));
        
        if (!survey.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta encuesta");
        }
        
        int totalResponses = survey.getTotalResponses();
        int completedResponses = survey.getCompletedResponses();
        int partialResponses = totalResponses - completedResponses;
        
        Double npsScore = null;
        int promoters = 0, passives = 0, detractors = 0;
        List<Double> npsScores = surveyResponseRepository.getNpsScoresBySurveyId(surveyId);
        
        if (!npsScores.isEmpty()) {
            for (Double score : npsScores) {
                if (score >= 9) promoters++;
                else if (score >= 7) passives++;
                else detractors++;
            }
            int total = promoters + passives + detractors;
            npsScore = ((promoters - detractors) * 100.0) / total;
        }
        
        List<SurveyAnalyticsDTO.QuestionAnalytics> questionAnalytics = new ArrayList<>();
        List<Question> questions = questionRepository.findBySurveyIdOrderByOrderIndexAsc(surveyId);
        
        for (Question question : questions) {
            SurveyAnalyticsDTO.QuestionAnalytics qa = buildQuestionAnalytics(question);
            questionAnalytics.add(qa);
        }
        
        List<SurveyAnalyticsDTO.DistributionPerformance> distPerformance = 
                distributionRepository.findBySurveyId(surveyId).stream()
                        .map(d -> {
                            SurveyAnalyticsDTO.DistributionPerformance dp = new SurveyAnalyticsDTO.DistributionPerformance();
                            dp.setDistributionId(d.getId());
                            dp.setName(d.getName());
                            dp.setChannel(d.getChannel().name());
                            dp.setSent(d.getSentCount());
                            dp.setDelivered(d.getDeliveredCount());
                            dp.setOpened(d.getOpenedCount());
                            dp.setResponded(d.getRespondedCount());
                            dp.setDeliveryRate(d.getSentCount() != null && d.getSentCount() > 0 ? 
                                    (d.getDeliveredCount() != null ? d.getDeliveredCount() : 0) * 100.0 / d.getSentCount() : 0.0);
                            dp.setOpenRate(d.getSentCount() != null && d.getSentCount() > 0 ? 
                                    (d.getOpenedCount() != null ? d.getOpenedCount() : 0) * 100.0 / d.getSentCount() : 0.0);
                            dp.setResponseRate(d.getSentCount() != null && d.getSentCount() > 0 ? 
                                    (d.getRespondedCount() != null ? d.getRespondedCount() : 0) * 100.0 / d.getSentCount() : 0.0);
                            return dp;
                        })
                        .collect(Collectors.toList());
        
        SurveyAnalyticsDTO dto = new SurveyAnalyticsDTO();
        dto.setSurveyId(surveyId);
        dto.setSurveyTitle(survey.getTitle());
        dto.setTotalResponses(totalResponses);
        dto.setCompletedResponses(completedResponses);
        dto.setPartialResponses(partialResponses);
        dto.setCompletionRate(survey.getCompletionRate());
        dto.setAverageCompletionTime(survey.getAverageCompletionTime());
        dto.setNpsScore(npsScore);
        dto.setPromoters(promoters);
        dto.setPassives(passives);
        dto.setDetractors(detractors);
        dto.setQuestionAnalytics(questionAnalytics);
        dto.setDistributionPerformance(distPerformance);
        return dto;
    }
    
    private SurveyAnalyticsDTO.QuestionAnalytics buildQuestionAnalytics(Question question) {
        SurveyAnalyticsDTO.QuestionAnalytics qa = new SurveyAnalyticsDTO.QuestionAnalytics();
        qa.setQuestionId(question.getId());
        qa.setQuestionText(question.getText());
        qa.setQuestionType(question.getType().name());
        
        List<com.numia.surveys.model.Answer> answers = answerRepository.findByQuestionId(question.getId());
        qa.setResponseCount(answers.size());
        
        if (isRatingQuestion(question.getType())) {
            Object[] stats = answerRepository.getNumericStatsByQuestionId(question.getId());
            if (stats != null && stats[0] != null) {
                qa.setMinRating((Double) stats[0]);
                qa.setMaxRating((Double) stats[1]);
                qa.setAverageRating((Double) stats[2]);
            }
            
            List<Object[]> distribution = answerRepository.getNumericDistributionByQuestionId(question.getId());
            Map<String, Integer> ratingDist = new LinkedHashMap<>();
            for (Object[] row : distribution) {
                if (row[0] != null) {
                    ratingDist.put(String.valueOf(((Number) row[0]).intValue()), ((Number) row[1]).intValue());
                }
            }
            qa.setRatingDistribution(ratingDist);
            
        } else if (isChoiceQuestion(question.getType())) {
            Map<String, Integer> optionCounts = new LinkedHashMap<>();
            Map<String, Double> optionPercentages = new LinkedHashMap<>();
            
            for (var option : question.getOptions()) {
                long count = answers.stream()
                        .filter(a -> a.getSelectedOptionIds() != null && 
                                Arrays.asList(a.getSelectedOptionIds().split(","))
                                        .contains(String.valueOf(option.getId())))
                        .count();
                optionCounts.put(option.getText(), (int) count);
            }
            
            int totalSelections = optionCounts.values().stream().mapToInt(Integer::intValue).sum();
            if (totalSelections > 0) {
                for (var entry : optionCounts.entrySet()) {
                    optionPercentages.put(entry.getKey(), (entry.getValue() * 100.0) / totalSelections);
                }
            }
            
            qa.setOptionCounts(optionCounts);
            qa.setOptionPercentages(optionPercentages);
            
        } else if (isTextQuestion(question.getType())) {
            List<String> textResponses = answerRepository.getTextResponsesByQuestionId(question.getId());
            qa.setTotalTextResponses(textResponses.size());
            qa.setSampleResponses(textResponses.stream().limit(10).collect(Collectors.toList()));
        }
        
        return qa;
    }
    
    private boolean isRatingQuestion(QuestionType type) {
        return type == QuestionType.NPS || type == QuestionType.CSAT || type == QuestionType.CES || 
               type == QuestionType.RATING_SCALE || type == QuestionType.STAR_RATING || type == QuestionType.SLIDER;
    }
    
    private boolean isChoiceQuestion(QuestionType type) {
        return type == QuestionType.SINGLE_CHOICE || type == QuestionType.MULTIPLE_CHOICE || 
               type == QuestionType.DROPDOWN || type == QuestionType.IMAGE_CHOICE;
    }
    
    private boolean isTextQuestion(QuestionType type) {
        return type == QuestionType.SHORT_TEXT || type == QuestionType.LONG_TEXT;
    }
}
