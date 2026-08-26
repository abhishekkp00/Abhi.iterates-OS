package com.abhiiterates.os.assessment.service;

import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalRequest;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalResult;
import com.abhiiterates.os.ai.retrieval.service.RetrievalService;
import com.abhiiterates.os.assessment.domain.QuestionDifficulty;
import com.abhiiterates.os.assessment.domain.QuestionType;
import com.abhiiterates.os.assessment.dto.*;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.user.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiAssessmentGeneratorServiceImpl implements AiAssessmentGeneratorService {

    private final AdaptiveAssessmentBlueprintEngine blueprintEngine;
    private final AssessmentValidationEngine validationEngine;
    private final AssessmentService assessmentService;
    private final RetrievalService retrievalService;
    private final TopicRepository topicRepository;
    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    @Override
    public CreateAssessmentRequest.Response generateAdaptiveAssessment(GenerateAdaptiveAssessmentRequest request, User user) {
        Topic topic = topicRepository.findByIdAndUserId(request.getTopicId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found or access denied: " + request.getTopicId()));

        // 1. Build Assessment Blueprint
        AssessmentBlueprint blueprint = blueprintEngine.buildBlueprint(request, user);

        // 2. RAG Retrieval from Student Resources if enabled
        StringBuilder ragContextText = new StringBuilder();
        if (request.isIncludeResources()) {
            try {
                RetrievalRequest retReq = RetrievalRequest.builder()
                        .query(topic.getName())
                        .topicId(topic.getId())
                        .build();
                List<RetrievalResult> hits = retrievalService.retrieve(retReq, user);
                if (hits != null && !hits.isEmpty()) {
                    ragContextText.append("RELEVANT GROUNDING MATERIAL FROM STUDENT RESOURCES:\n");
                    for (int i = 0; i < Math.min(hits.size(), 3); i++) {
                        RetrievalResult hit = hits.get(i);
                        ragContextText.append(String.format("--- Document: %s ---\n%s\n\n", hit.documentTitle(), hit.text()));
                    }
                }
            } catch (Exception e) {
                log.warn("RAG retrieval skipped or encountered exception for assessment generation: {}", e.getMessage());
            }
        }

        // 3. Construct Structured LLM Prompt
        String systemPrompt = """
            You are an expert academic assessment engine for higher education.
            Your task is to generate a high-quality, multiple-choice assessment grounded in academic concepts.

            OUTPUT FORMAT INSTRUCTIONS:
            Return ONLY a valid JSON array of question objects without code block markup or prose text.
            Each object in the array MUST strictly follow this JSON schema:
            [
              {
                "questionText": "Clear question formulation",
                "questionType": "MULTIPLE_CHOICE",
                "difficulty": "%s",
                "marks": 1.0,
                "explanation": "Detailed explanation of the correct answer",
                "options": [
                  { "optionText": "Option A text", "isCorrect": true },
                  { "optionText": "Option B text", "isCorrect": false },
                  { "optionText": "Option C text", "isCorrect": false },
                  { "optionText": "Option D text", "isCorrect": false }
                ]
              }
            ]
            
            RULES:
            1. Generate exactly %d questions.
            2. Each question MUST have exactly 4 options.
            3. Exactly 1 option per question MUST have isCorrect: true.
            4. Tailor difficulty to %s.
            """.formatted(
                blueprint.getTargetDifficulty().name(),
                request.getQuestionCount(),
                blueprint.getTargetDifficulty().name()
        );

        String userPrompt = String.format("""
            TARGET TOPIC: %s
            STUDENT LEARNING STATE: %s (Accuracy: %.1f%%)
            BLUEPRINT RATIONALE: %s
            FOCUS AREAS: %s

            %s

            Generate the %d-question adaptive assessment JSON array now.
            """,
                topic.getName(),
                blueprint.getLearningState(),
                blueprint.getAccuracyPercentage(),
                blueprint.getRationale(),
                String.join(", ", blueprint.getFocusAreas()),
                ragContextText,
                request.getQuestionCount()
        );

        log.info("Requesting LLM assessment generation for topic [{}] user [{}]", topic.getName(), user.getId());

        // 4. Invoke LLM outside DB transaction
        String llmResponse = chatClient.prompt()
                .system(systemPrompt)
                .user(userPrompt)
                .call()
                .content();

        // 5. Parse JSON output
        List<GeneratedQuestionDto> rawQuestions = parseLlmResponse(llmResponse);

        // 6. Validate & Sanitize Questions
        List<GeneratedQuestionDto> validatedQuestions = validationEngine.validateAndSanitize(rawQuestions);

        // 7. Persist Assessment & Questions
        String title = "Adaptive Test: " + topic.getName();
        String description = blueprint.getRationale();
        int estimatedDuration = Math.max(5, validatedQuestions.size() * 3);
        UUID subjectId = request.getSubjectId() != null ? request.getSubjectId() : (topic.getSubject() != null ? topic.getSubject().getId() : null);

        CreateAssessmentRequest createReq = new CreateAssessmentRequest(
                title,
                description,
                subjectId,
                List.of(topic.getId()),
                estimatedDuration
        );

        CreateAssessmentRequest.Response draftResp = assessmentService.createAssessment(createReq, user);
        UUID assessmentId = draftResp.id();

        int order = 1;
        for (GeneratedQuestionDto qDto : validatedQuestions) {
            List<CreateQuestionOptionRequest> optRequests = new ArrayList<>();
            int optOrder = 1;
            for (GeneratedQuestionDto.GeneratedOptionDto opt : qDto.getOptions()) {
                optRequests.add(new CreateQuestionOptionRequest(
                        opt.getOptionText(),
                        optOrder++,
                        opt.getIsCorrect()
                ));
            }

            CreateQuestionRequest qReq = new CreateQuestionRequest(
                    topic.getId(),
                    qDto.getQuestionText(),
                    qDto.getQuestionType() != null ? qDto.getQuestionType() : QuestionType.MULTIPLE_CHOICE,
                    qDto.getDifficulty() != null ? qDto.getDifficulty() : QuestionDifficulty.MEDIUM,
                    qDto.getMarks() != null ? qDto.getMarks() : 1.0,
                    order++,
                    optRequests
            );

            assessmentService.addQuestion(assessmentId, qReq, user);
        }

        // 8. Auto-publish Assessment so it's ready for immediate test taking
        CreateAssessmentRequest.Response published = assessmentService.publishAssessment(assessmentId, user);
        log.info("Successfully generated and published adaptive assessment [{}] with [{}] questions", published.id(), published.questionCount());

        return published;
    }

    private List<GeneratedQuestionDto> parseLlmResponse(String jsonText) {
        if (jsonText == null || jsonText.isBlank()) {
            throw new IllegalStateException("LLM returned empty output for assessment generation.");
        }

        String cleanJson = jsonText.trim();
        if (cleanJson.startsWith("```json")) {
            cleanJson = cleanJson.substring(7);
        } else if (cleanJson.startsWith("```")) {
            cleanJson = cleanJson.substring(3);
        }
        if (cleanJson.endsWith("```")) {
            cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
        }
        cleanJson = cleanJson.trim();

        try {
            return objectMapper.readValue(cleanJson, new TypeReference<List<GeneratedQuestionDto>>() {});
        } catch (Exception e) {
            log.error("Failed to parse LLM JSON response into GeneratedQuestionDto list. Raw text: {}", cleanJson, e);
            throw new IllegalStateException("LLM returned malformed question structure: " + e.getMessage());
        }
    }
}
