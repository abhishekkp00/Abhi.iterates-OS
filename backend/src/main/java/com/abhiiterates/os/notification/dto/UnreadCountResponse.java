package com.abhiiterates.os.notification.dto;

/**
 * UnreadCountResponse — thin payload sent to the client after any read/delete
 * action so the bell badge stays synchronised without a full refetch.
 */
public record UnreadCountResponse(long unreadCount) {}
