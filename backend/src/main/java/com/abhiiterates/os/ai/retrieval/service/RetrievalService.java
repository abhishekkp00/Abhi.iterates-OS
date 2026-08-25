package com.abhiiterates.os.ai.retrieval.service;

import com.abhiiterates.os.ai.retrieval.dto.RetrievalRequest;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalResult;
import com.abhiiterates.os.user.User;

import java.util.List;

public interface RetrievalService {

    List<RetrievalResult> retrieve(String query, User currentUser);

    List<RetrievalResult> retrieve(RetrievalRequest request, User currentUser);
}
