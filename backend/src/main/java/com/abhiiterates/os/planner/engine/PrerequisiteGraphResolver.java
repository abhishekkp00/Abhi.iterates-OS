package com.abhiiterates.os.planner.engine;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Resolves the topological ordering of topics given a prerequisite DAG.
 * <p>
 * Uses <strong>Kahn's algorithm</strong> (BFS-based topological sort) which naturally
 * detects cycles: if any nodes remain unprocessed after the BFS, a cycle exists.
 * <p>
 * On cycle detection: this resolver does <strong>not</strong> throw an exception.
 * Instead, it logs a warning and appends the cyclic topics in an arbitrary stable
 * order at the end of the result. This makes the planner resilient to malformed
 * prerequisite graphs.
 * <p>
 * Usage: topics earlier in the returned list are prerequisites of topics later in
 * the list. The planner uses this ordering to schedule prerequisite topics on
 * earlier days.
 */
@Component
@Slf4j
public class PrerequisiteGraphResolver {

    /**
     * Resolves a topological ordering over the given topic IDs using the provided
     * prerequisite edges.
     *
     * @param topicIds         Set of all topic IDs to order
     * @param prerequisiteEdges Map from topicId → list of its prerequisite topic IDs
     *                          (topics that must come BEFORE it)
     * @return Ordered list of topic IDs: prerequisites appear before dependents.
     *         If a topic has no prerequisites it appears first (or in arbitrary order
     *         relative to other zero-in-degree topics). Cyclic topics are appended last.
     */
    public List<UUID> resolveTopologicalOrder(
        Collection<UUID> topicIds,
        Map<UUID, List<UUID>> prerequisiteEdges
    ) {
        if (topicIds == null || topicIds.isEmpty()) {
            return Collections.emptyList();
        }

        Set<UUID> allTopics = new LinkedHashSet<>(topicIds);

        // Build adjacency and in-degree maps
        // adjacency: prerequisiteId → list of dependents (topicIds that need it first)
        Map<UUID, List<UUID>> adjacency   = new HashMap<>();
        Map<UUID, Integer>    inDegree    = new HashMap<>();

        for (UUID topicId : allTopics) {
            adjacency.putIfAbsent(topicId, new ArrayList<>());
            inDegree.putIfAbsent(topicId, 0);
        }

        for (Map.Entry<UUID, List<UUID>> entry : prerequisiteEdges.entrySet()) {
            UUID topicId = entry.getKey();
            if (!allTopics.contains(topicId)) continue;

            for (UUID prereqId : entry.getValue()) {
                if (!allTopics.contains(prereqId)) continue; // skip cross-user edges
                adjacency.computeIfAbsent(prereqId, k -> new ArrayList<>()).add(topicId);
                inDegree.merge(topicId, 1, Integer::sum);
            }
        }

        // Kahn's BFS
        Queue<UUID> queue = new LinkedList<>();
        for (UUID topicId : allTopics) {
            if (inDegree.getOrDefault(topicId, 0) == 0) {
                queue.offer(topicId);
            }
        }

        List<UUID> result = new ArrayList<>(allTopics.size());
        while (!queue.isEmpty()) {
            UUID current = queue.poll();
            result.add(current);
            for (UUID dependent : adjacency.getOrDefault(current, Collections.emptyList())) {
                int newDegree = inDegree.merge(dependent, -1, Integer::sum);
                if (newDegree == 0) {
                    queue.offer(dependent);
                }
            }
        }

        // Cycle detection: if result.size() < allTopics.size(), there are cycles
        if (result.size() < allTopics.size()) {
            Set<UUID> processed = new HashSet<>(result);
            List<UUID> cyclic = allTopics.stream()
                .filter(id -> !processed.contains(id))
                .toList();
            log.warn("[PrerequisiteGraphResolver] Cycle detected in prerequisite graph for {} topic(s): {}. " +
                "These topics will be appended in arbitrary order.", cyclic.size(), cyclic);
            result.addAll(cyclic);
        }

        return result;
    }

    /**
     * Convenience method: builds the prerequisite edge map from a flat list of
     * (topicId, prerequisiteTopicId) pairs and calls {@link #resolveTopologicalOrder}.
     *
     * @param topicIds         All topic IDs to include in the ordering
     * @param edgePairs        List of [topicId, prerequisiteTopicId] pairs
     * @return Topologically sorted topic IDs, prerequisites-first
     */
    public List<UUID> resolveFromEdgePairs(
        Collection<UUID> topicIds,
        List<UUID[]> edgePairs
    ) {
        Map<UUID, List<UUID>> prerequisiteEdges = new HashMap<>();
        for (UUID[] pair : edgePairs) {
            UUID topicId  = pair[0];
            UUID prereqId = pair[1];
            prerequisiteEdges.computeIfAbsent(topicId, k -> new ArrayList<>()).add(prereqId);
        }
        return resolveTopologicalOrder(topicIds, prerequisiteEdges);
    }
}
