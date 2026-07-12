package com.abhiiterates.os.resource;

import com.abhiiterates.os.resource.dto.AttachmentResponse;
import com.abhiiterates.os.user.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface AttachmentService {
    AttachmentResponse upload(UUID resourceId, MultipartFile file, User user);
    org.springframework.core.io.Resource download(UUID attachmentId, User user);
    void delete(UUID attachmentId, User user);
}
