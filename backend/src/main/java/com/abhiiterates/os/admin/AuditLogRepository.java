package com.abhiiterates.os.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(LOWER(a.adminEmail) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.action) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.target) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.details) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY a.createdAt DESC")
    List<AuditLog> searchAuditLogs(@Param("search") String search);
}
