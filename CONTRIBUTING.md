# Contributing to AbhiIterates.OS

This document defines the engineering standards for contributing to this project.
These are not suggestions — they are the rules every commit must follow.

---

## Branching Strategy

We follow **GitHub Flow** with a protected `main` branch.

```
main          ← production-ready code only
  └── develop ← integration branch (always deployable)
        ├── feat/authentication-module
        ├── feat/pdf-viewer
        ├── fix/jwt-expiry-handling
        └── chore/update-dependencies
```

### Branch Naming Rules

| Prefix | Use When |
|---|---|
| `feat/` | Adding a new feature |
| `fix/` | Fixing a bug |
| `chore/` | Maintenance, dependencies, config |
| `docs/` | Documentation changes only |
| `refactor/` | Code restructuring without behavior change |
| `test/` | Adding or fixing tests |
| `perf/` | Performance improvements |

**Examples:**
```
feat/user-authentication
feat/pdf-highlight-toolbar
fix/refresh-token-rotation
chore/upgrade-spring-boot-3.4
docs/api-authentication-guide
refactor/extract-email-service
```

---

## Commit Message Standard

We follow the **Conventional Commits** specification.
See: https://www.conventionalcommits.org

### Format

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

### Rules

- **type** is lowercase, from the list below
- **scope** is the module/area affected (optional but recommended)
- **summary** is present tense, no period, max 72 characters
- **body** explains WHY, not WHAT (the diff shows what)
- **footer** references issues: `Closes #123`, `Refs #456`

### Types

| Type | When to Use |
|---|---|
| `feat` | New feature or behavior |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no logic change) |
| `refactor` | Code restructuring |
| `test` | Tests |
| `chore` | Build scripts, dependencies, config |
| `perf` | Performance improvement |
| `ci` | CI/CD pipeline changes |
| `revert` | Reverting a previous commit |

### Examples

```bash
# Good
feat(auth): implement JWT refresh token rotation
fix(pdf): resolve page rendering crash on mobile Safari
docs(api): add authentication endpoint documentation
chore(deps): upgrade Spring Boot to 3.4.1
refactor(library): extract file validation into dedicated service
test(auth): add unit tests for token expiry edge cases
perf(search): add database index on resource title column

# Bad — never do these
git commit -m "fix stuff"
git commit -m "WIP"
git commit -m "asdfgh"
git commit -m "Update"
git commit -m "changes"
```

### Breaking Changes

If a commit introduces a breaking API change, add `!` after the type:

```
feat(api)!: rename /api/v1/resources to /api/v1/library

BREAKING CHANGE: All clients must update endpoint URLs.
Old: POST /api/v1/resources
New: POST /api/v1/library/resources
```

---

## Pull Request Rules

1. Every PR must reference an issue: `Closes #42`
2. PRs must be reviewed before merging to `develop`
3. No force pushes to `main` or `develop`
4. Squash merge only — keep history clean
5. PR title must follow the same Conventional Commit format
6. Self-review your diff before requesting review

---

## Code Review Standards

When reviewing, check for:

- [ ] Does it solve the stated problem?
- [ ] Are there edge cases not handled?
- [ ] Is there missing validation?
- [ ] Are there potential security vulnerabilities?
- [ ] Is there unnecessary complexity?
- [ ] Are variable names meaningful?
- [ ] Are there missing tests for critical paths?
- [ ] Does it follow the established patterns in the codebase?

---

## What We Never Do

- Never commit `.env` files
- Never hardcode secrets, API keys, passwords, or URLs
- Never use `any` in TypeScript without a comment explaining why
- Never skip input validation on API endpoints
- Never write `TODO` comments without an associated issue number
- Never merge without testing locally
- Never push directly to `main`

---

## Versioning

We follow **Semantic Versioning** (SemVer): `MAJOR.MINOR.PATCH`

```
v0.1.0  ← Foundation (today)
v0.2.0  ← Authentication complete
v0.3.0  ← MVP feature complete
v1.0.0  ← Production launch
```

---

*These standards exist to make this codebase readable, reviewable, and maintainable
by any engineer — including yourself six months from now.*
