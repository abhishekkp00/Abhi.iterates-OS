package com.abhishek.Abhiiterates.entity;

import com.abhishek.Abhiiterates.enums.GoalStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "learning_goals")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class LearningGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private GoalStatus status = GoalStatus.ACTIVE;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(name = "progress_percent")
    @Builder.Default
    private Integer progressPercent = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "learningGoal", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Task> tasks;

    @OneToMany(mappedBy = "learningGoal", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Resource> resources;

    @OneToMany(mappedBy = "learningGoal", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<StudyLog> studyLogs;
}