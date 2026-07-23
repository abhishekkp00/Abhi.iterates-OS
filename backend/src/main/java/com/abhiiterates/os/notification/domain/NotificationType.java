package com.abhiiterates.os.notification.domain;

/**
 * NotificationType — categorises every event that can trigger a notification.
 *
 * Used by the frontend to render the correct icon and accent colour.
 */
public enum NotificationType {

    // ── Resource Module ───────────────────────────────────────────────────────
    RESOURCE_SHARED,       // Someone shared a resource with this user
    RESOURCE_COMMENTED,    // A comment was added to a resource owned by this user

    // ── Marketplace Module ────────────────────────────────────────────────────
    MARKETPLACE_OFFER,     // A buyer made an offer on a seller's listing
    MARKETPLACE_SOLD,      // A listing was purchased
    MARKETPLACE_LISTING,   // A new listing was created

    // ── AI Module ─────────────────────────────────────────────────────────────
    AI_RESPONSE,           // AI completed a long-running response

    // ── Productivity Module ───────────────────────────────────────────────────
    TASK_DUE_SOON,         // A task is due within 24 hours
    TASK_COMPLETED,        // A collaborator completed a shared task

    // ── Collaboration ─────────────────────────────────────────────────────────
    MENTION,               // User was @mentioned in a comment

    // ── System ────────────────────────────────────────────────────────────────
    SYSTEM_ANNOUNCEMENT    // Platform-wide broadcast
}
