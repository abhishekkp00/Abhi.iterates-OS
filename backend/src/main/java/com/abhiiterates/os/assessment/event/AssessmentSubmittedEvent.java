package com.abhiiterates.os.assessment.event;

import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.assessment.domain.AssessmentAttempt;
import com.abhiiterates.os.user.User;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Domain Event fired when a student submits an assessment attempt.
 * <p>
 * Processed asynchronously after transaction commit to detect whether learning evidence
 * has materially changed and active study plans require review/replanning.
 */
@Getter
public class AssessmentSubmittedEvent extends ApplicationEvent {

    private final User user;
    private final AssessmentAttempt attempt;
    private final Map<Topic, Double> topicPercentages;

    public AssessmentSubmittedEvent(Object source, User user, AssessmentAttempt attempt, Map<Topic, Double> topicPercentages) {
        super(source);
        this.user = Objects.requireNonNull(user, "User cannot be null");
        this.attempt = Objects.requireNonNull(attempt, "AssessmentAttempt cannot be null");
        this.topicPercentages = topicPercentages != null ? topicPercentages : Map.of();
    }

    public Set<Topic> getAffectedTopics() {
        return topicPercentages.keySet();
    }
}
