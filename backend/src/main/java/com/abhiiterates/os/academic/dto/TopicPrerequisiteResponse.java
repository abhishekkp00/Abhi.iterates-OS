package com.abhiiterates.os.academic.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record TopicPrerequisiteResponse(
    UUID id,
    UUID topicId,
    String topicName,
    UUID prerequisiteTopicId,
    String prerequisiteTopicName,
    UUID subjectId,
    String subjectName
) {}
