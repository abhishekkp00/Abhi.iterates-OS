package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.dto.TopicPrerequisiteResponse;
import com.abhiiterates.os.user.User;

import java.util.List;
import java.util.UUID;

public interface TopicPrerequisiteService {

    /**
     * Add a prerequisite relationship: prerequisiteTopicId must be studied before topicId.
     *
     * @param topicId             The dependent topic (the one that has prerequisites)
     * @param prerequisiteTopicId The prerequisite topic (must be done first)
     * @param user                Authenticated user — both topics must belong to them
     * @return The created prerequisite edge
     */
    TopicPrerequisiteResponse addPrerequisite(UUID topicId, UUID prerequisiteTopicId, User user);

    /**
     * Get all prerequisite topics for a given topic.
     *
     * @param topicId The topic to get prerequisites for
     * @param user    Authenticated user (IDOR enforcement)
     * @return List of prerequisite edges
     */
    List<TopicPrerequisiteResponse> getPrerequisites(UUID topicId, User user);

    /**
     * Remove a prerequisite relationship.
     *
     * @param topicId             The dependent topic
     * @param prerequisiteTopicId The prerequisite to remove
     * @param user                Authenticated user
     */
    void removePrerequisite(UUID topicId, UUID prerequisiteTopicId, User user);
}
