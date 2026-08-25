package com.abhiiterates.os.academic.controller;

import com.abhiiterates.os.academic.domain.EvidenceLevel;
import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.domain.LearningTrend;
import com.abhiiterates.os.academic.dto.LearningStateResult;
import com.abhiiterates.os.academic.dto.SubjectLearningStateSummary;
import com.abhiiterates.os.academic.service.LearningStateService;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/academic")
@RequiredArgsConstructor
public class LearningStateController {

    private final LearningStateService learningStateService;

    @GetMapping("/topics/{topicId}/learning-state")
    public ResponseEntity<LearningStateResult> getTopicLearningState(
            @PathVariable UUID topicId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(learningStateService.getTopicLearningState(topicId, user));
    }

    @GetMapping("/learning-state/topics")
    public ResponseEntity<List<LearningStateResult>> getUserTopicsLearningState(
            @RequestParam(required = false) UUID subjectId,
            @RequestParam(required = false) LearningState state,
            @RequestParam(required = false) LearningTrend trend,
            @RequestParam(required = false) EvidenceLevel evidenceLevel,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(learningStateService.getUserTopicsLearningState(user, subjectId, state, trend, evidenceLevel));
    }

    @GetMapping("/subjects/{subjectId}/learning-state")
    public ResponseEntity<SubjectLearningStateSummary> getSubjectLearningStateSummary(
            @PathVariable UUID subjectId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(learningStateService.getSubjectLearningStateSummary(subjectId, user));
    }
}
