package com.abhiiterates.os.assessment.domain;

import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.common.BaseAuditEntity;
import com.abhiiterates.os.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "topic_assessment_performance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopicAssessmentPerformance extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    private AssessmentAttempt attempt;

    @Column(name = "questions_attempted", nullable = false)
    @Builder.Default
    private Integer questionsAttempted = 0;

    @Column(name = "questions_correct", nullable = false)
    @Builder.Default
    private Integer questionsCorrect = 0;

    @Column(name = "marks_obtained", nullable = false)
    @Builder.Default
    private Double marksObtained = 0.00;

    @Column(name = "marks_available", nullable = false)
    @Builder.Default
    private Double marksAvailable = 0.00;

    @Column(nullable = false)
    @Builder.Default
    private Double percentage = 0.00;

    @Column(name = "evaluated_at", nullable = false)
    private Instant evaluatedAt;
}
