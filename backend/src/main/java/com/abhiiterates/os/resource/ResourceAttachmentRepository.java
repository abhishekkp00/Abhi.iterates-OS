package com.abhiiterates.os.resource;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

import java.util.Optional;

@Repository
public interface ResourceAttachmentRepository extends JpaRepository<ResourceAttachment, UUID> {
    Optional<ResourceAttachment> findByDownloadUrl(String downloadUrl);
}
