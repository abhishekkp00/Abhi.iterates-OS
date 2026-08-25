package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.dto.SubjectRequest;
import com.abhiiterates.os.academic.dto.TopicRequest;
import com.abhiiterates.os.user.User;

import java.util.List;
import java.util.UUID;

public interface AcademicService {
    SubjectRequest.Response createSubject(SubjectRequest request, User user);
    List<SubjectRequest.Response> getUserSubjects(User user);
    SubjectRequest.Response getSubjectById(UUID subjectId, User user);
    
    TopicRequest.Response createTopic(TopicRequest request, User user);
    List<TopicRequest.Response> getTopicsBySubject(UUID subjectId, User user);
    Topic validateTopicOwnership(UUID topicId, User user);
}
