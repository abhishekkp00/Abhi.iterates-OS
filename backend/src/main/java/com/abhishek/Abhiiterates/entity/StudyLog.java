package com.abhishek.Abhiiterates.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "study_logs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class StudyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "mood_score")   // 1-5, optional self-rating
    private Integer moodScore;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learning_goal_id", nullable = false)
    private LearningGoal learningGoal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;
}