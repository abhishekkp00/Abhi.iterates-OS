package com.abhiiterates.os.planner;

import com.abhiiterates.os.planner.engine.PrerequisiteGraphResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for {@link PrerequisiteGraphResolver} — Kahn's topological sort.
 * Covers correctness, cycle detection, and edge cases.
 * No Spring context — pure Java unit tests.
 */
class PrerequisiteGraphResolverTest {

    private PrerequisiteGraphResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new PrerequisiteGraphResolver();
    }

    @Test
    @DisplayName("Empty topic set → empty list returned")
    void emptyTopics_returnsEmpty() {
        List<UUID> result = resolver.resolveTopologicalOrder(Collections.emptyList(), Collections.emptyMap());
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Single topic with no prerequisites → returns that topic")
    void singleTopic_noPrerequisites() {
        UUID topicA = UUID.randomUUID();
        List<UUID> result = resolver.resolveTopologicalOrder(List.of(topicA), Collections.emptyMap());
        assertThat(result).containsExactly(topicA);
    }

    @Test
    @DisplayName("Linear chain A→B→C: C prereq B, B prereq A → order is [A, B, C]")
    void linearChain_correctOrder() {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        UUID c = UUID.randomUUID();

        // B requires A; C requires B
        Map<UUID, List<UUID>> edges = new LinkedHashMap<>();
        edges.put(b, List.of(a));   // b has prereq a
        edges.put(c, List.of(b));   // c has prereq b

        List<UUID> result = resolver.resolveTopologicalOrder(List.of(a, b, c), edges);

        assertThat(result).hasSize(3);
        // A must come before B, B must come before C
        assertThat(result.indexOf(a)).isLessThan(result.indexOf(b));
        assertThat(result.indexOf(b)).isLessThan(result.indexOf(c));
    }

    @Test
    @DisplayName("Diamond DAG: C and D both depend on A; B depends on C and D → A first, B last")
    void diamondDag_correctOrder() {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        UUID c = UUID.randomUUID();
        UUID d = UUID.randomUUID();

        // c prereq a, d prereq a, b prereq c and d
        Map<UUID, List<UUID>> edges = Map.of(
            c, List.of(a),
            d, List.of(a),
            b, List.of(c, d)
        );

        List<UUID> result = resolver.resolveTopologicalOrder(List.of(a, b, c, d), edges);

        assertThat(result).hasSize(4);
        assertThat(result.indexOf(a)).isLessThan(result.indexOf(c));
        assertThat(result.indexOf(a)).isLessThan(result.indexOf(d));
        assertThat(result.indexOf(c)).isLessThan(result.indexOf(b));
        assertThat(result.indexOf(d)).isLessThan(result.indexOf(b));
    }

    @Test
    @DisplayName("Disconnected graph: independent topics A, B, C with no edges → all 3 in result")
    void disconnectedGraph_allTopicsIncluded() {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        UUID c = UUID.randomUUID();

        List<UUID> result = resolver.resolveTopologicalOrder(List.of(a, b, c), Collections.emptyMap());

        assertThat(result).hasSize(3).containsExactlyInAnyOrder(a, b, c);
    }

    @Test
    @DisplayName("Cycle A→B→A: cycle detected — all topics included in result, no exception thrown")
    void cycle_doesNotThrow_allTopicsIncluded() {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();

        // A requires B; B requires A — direct cycle
        Map<UUID, List<UUID>> edges = Map.of(
            a, List.of(b),
            b, List.of(a)
        );

        // Must NOT throw, must include all topics
        assertThatCode(() -> {
            List<UUID> result = resolver.resolveTopologicalOrder(List.of(a, b), edges);
            assertThat(result).hasSize(2).containsExactlyInAnyOrder(a, b);
        }).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("3-node cycle A→B→C→A: cycle detected — all 3 in result, no exception")
    void threeNodeCycle_allTopicsIncluded() {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        UUID c = UUID.randomUUID();

        Map<UUID, List<UUID>> edges = Map.of(
            a, List.of(c),  // a requires c
            b, List.of(a),  // b requires a
            c, List.of(b)   // c requires b — cycle!
        );

        assertThatCode(() -> {
            List<UUID> result = resolver.resolveTopologicalOrder(List.of(a, b, c), edges);
            assertThat(result).hasSize(3).containsExactlyInAnyOrder(a, b, c);
        }).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Mixed: some topics in cycle, some not — non-cyclic topics retain valid ordering")
    void mixed_cyclicAndNonCyclic() {
        UUID a = UUID.randomUUID(); // no prerequisites, no dependents
        UUID b = UUID.randomUUID(); // part of cycle
        UUID c = UUID.randomUUID(); // part of cycle

        // b and c form a cycle; a is isolated
        Map<UUID, List<UUID>> edges = Map.of(
            b, List.of(c),
            c, List.of(b)
        );

        List<UUID> result = resolver.resolveTopologicalOrder(List.of(a, b, c), edges);
        assertThat(result).hasSize(3).containsExactlyInAnyOrder(a, b, c);
        // A should appear before the cyclic nodes (it has in-degree 0)
        assertThat(result.indexOf(a)).isLessThan(Math.max(result.indexOf(b), result.indexOf(c)));
    }

    @Test
    @DisplayName("resolveFromEdgePairs: same as resolveTopologicalOrder using pair list")
    void resolveFromEdgePairs_correct() {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        UUID c = UUID.randomUUID();

        // b requires a; c requires b
        List<UUID[]> pairs = List.of(
            new UUID[]{b, a},
            new UUID[]{c, b}
        );

        List<UUID> result = resolver.resolveFromEdgePairs(List.of(a, b, c), pairs);

        assertThat(result).hasSize(3);
        assertThat(result.indexOf(a)).isLessThan(result.indexOf(b));
        assertThat(result.indexOf(b)).isLessThan(result.indexOf(c));
    }
}
