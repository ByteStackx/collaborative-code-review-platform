# collaborative-code-review-platform

CodeTribe Node collaborative code review platform

## API overview

This document lists the REST endpoints implemented so far, their purposes, required auth/roles, and request/response shapes. It covers Auth, Users, Projects, and Submissions. Comments and Review features are not documented in this section.

All endpoints return JSON. Timestamps are ISO-8601 strings. IDs are strings unless noted otherwise.

Authentication
- JWT via Authorization header: `Authorization: Bearer <token>`
- Roles: `submitter` and `reviewer`

Environment
- SECRET_KEY: JWT signing secret
- PORT (default 5000)
- Database: PG vars (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)

---

## Auth

POST /api/auth/register
- Description: Create a new user account (defaults to role `submitter`).
- Auth: Not required
- Body:
	- email (string, required)
	- name (string, required)
	- password (string, required)
- Response 201:
	- user: { id, email, name, role, created_at, updated_at }

POST /api/auth/login
- Description: Log in and obtain a JWT.
- Auth: Not required
- Body:
	- email (string, required)
	- password (string, required)
- Response 200:
	- { message: string, token: string }

---

## Users

GET /api/users/:id
- Description: Get a user's public profile.
- Auth: Required
- Permissions: The requested :id must match the authenticated user, or requester must be `reviewer`.
- Params:
	- id (string, required)
- Response 200:
	- { id, email, name, role, created_at, updated_at }

PUT /api/users/:id
- Description: Update a user's profile.
- Auth: Required
- Permissions: Self or `reviewer`.
- Params:
	- id (string, required)
- Body (any subset):
	- email (string)
	- name (string)
	- password (string)
	- role ("submitter" | "reviewer")
- Response 200:
	- { id, email, name, role, created_at, updated_at }

DELETE /api/users/:id
- Description: Delete a user.
- Auth: Required
- Permissions: `reviewer` only
- Params:
	- id (string, required)
- Response 204: empty

---

## Projects

GET /api/projects
- Description: List projects.
- Auth: Required
- Response 200:
	- Array<{ id, name, description, created_by, created_at, updated_at }>

POST /api/projects
- Description: Create a project. `created_by` is derived from the JWT subject.
- Auth: Required
- Permissions: `submitter` or `reviewer`
- Body:
	- name (string, required)
	- description (string, optional)
- Response 201:
	- { id, name, description, created_by, created_at, updated_at }

POST /api/projects/:id/members
- Description: Add a user as a project member.
- Auth: Required
- Permissions: `reviewer` only
- Params:
	- id (string, project id, required)
- Body:
	- userId (string, required)
- Response 201:
	- { project_id, user_id }

DELETE /api/projects/:id/members/:userId
- Description: Remove a project member.
- Auth: Required
- Permissions: `reviewer` only
- Params:
	- id (string, project id, required)
	- userId (string, required)
- Response 204: empty

GET /api/projects/:id/submissions
- Description: List submissions belonging to a project.
- Auth: Required
- Permissions: Must be a member of the project (or project creator)
- Params:
	- id (string, project id, required)
- Response 200:
	- Array<Submission>

---

## Submissions

POST /api/submissions
- Description: Create a submission (text/code) and associate it with a project.
- Auth: Required
- Permissions: Must be a member of the target project (or project creator)
- Body:
	- projectId (string, required)
	- title (string, required)
	- content (string, required)
- Response 201:
	- Submission: { id, project_id, submitted_by, title, content, status, created_at, updated_at }
	- status values: "pending" | "in_review" | "approved" | "changes_requested"

GET /api/submissions/:id
- Description: Get a single submission by ID.
- Auth: Required
- Permissions: Must be a member of the submission's project (or project creator)
- Params:
	- id (string, submission id, required)
- Response 200:
	- { id, project_id, submitted_by, title, content, status, created_at, updated_at }

PATCH /api/submissions/:id/status
- Description: Update a submission's status.
- Auth: Required
- Permissions: `reviewer` only
- Params:
	- id (string, submission id, required)
- Body:
	- status ("pending" | "in_review" | "approved" | "changes_requested", required)
- Response 200:
	- { id, project_id, submitted_by, title, content, status, created_at, updated_at }

DELETE /api/submissions/:id
- Description: Delete a submission.
- Auth: Required
- Permissions: `reviewer` only
- Params:
	- id (string, submission id, required)
- Response 204: empty
