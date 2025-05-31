# Work Plan: SECURE-V1-001 - Security Hardening

*   **Task ID**: SECURE-V1-001
*   **Phase**: 5 - Integration, Testing & Refinement (V1)
*   **Status**: Not Started
*   **Estimate**: 1 Day
*   **Author**: Gemini
*   **Dependencies**: INFRA-V1-001, INFRA-V1-002 (IAM Roles, Firestore Rules defined), SETUP-V1-002 (CI/CD for dependency scanning), All components implemented.
*   **Related Docs**: `docs/architecture_v2.md` (Section 10, 13.6), `infra/firestore.rules`, `infra/iam.tf`.

## Problem Statement

Perform a focused security review and hardening pass on the application infrastructure and code. This involves refining Firestore security rules, tightening IAM permissions based on the Principle of Least Privilege, reviewing dependency vulnerabilities, and ensuring secure configuration settings.

## Components Involved

*   Firestore Security Rules (`infra/firestore.rules`)
*   GCP IAM Roles & Bindings (`infra/iam.tf`)
*   Google Secret Manager (Usage review)
*   Cloud Function / Cloud Run configurations (Authentication, Invocation settings)
*   NPM Dependencies (`package.json`, `package-lock.json`)
*   Source Code (Review for potential vulnerabilities like improper input handling - less critical for V1 scope).

## Proposed Solution / Design Approach

1.  **Refine Firestore Rules:**
    *   Review the basic rules defined in INFRA-V1-002 (`firestore.rules`).
    *   Make rules more specific where possible. Instead of broad `allow read, write` for service accounts, can specific paths be restricted further? (e.g., Planner SA probably doesn't need to write to `Campaign` metadata).
    *   Ensure default access is denied.
    *   Validate rules using the Firestore Rules Simulator in the GCP Console.
    *   Deploy updated rules via Terraform (`local-exec` or provider).
2.  **Review & Tighten IAM Roles:**
    *   Review the roles granted to `storyteller-sa`, `planner-sa`, `discord-bot-sa` in `infra/iam.tf`.
    *   Apply the Principle of Least Privilege: Does each SA *really* need all the permissions granted? (e.g., Does Storyteller need full `datastore.user` or could a more restricted role work? Does Bot SA need roles beyond invoking Storyteller, accessing secrets, and Live Voice API?).
    *   Replace broad roles (like `roles/aiplatform.user`) with more specific ones if available and sufficient (e.g., roles for specific Gemini/Voice API usage).
    *   Remove any unnecessary permissions.
    *   Apply changes via Terraform.
3.  **Review Service Configuration:**
    *   **Storyteller CFn:** Ensure HTTPS trigger is configured to require authentication (verified in AGENT-V1-STORY-001).
    *   **Planner CFn:** Ensure it can only be triggered by the legitimate Eventarc trigger linked to its SA.
    *   **Discord Bot Cloud Run:** Ensure only necessary ingress is allowed. If possible, restrict direct access and only allow invocation via expected mechanisms (though less relevant for a bot client).
4.  **Dependency Vulnerability Check:**
    *   Run `npm audit` locally and ensure it's part of the CI/CD pipeline (SETUP-V1-002).
    *   Review any reported High/Critical vulnerabilities and plan for remediation (update package, replace package, accept risk if unavoidable/not exploitable).
5.  **Secret Management Review:**
    *   Confirm all secrets (Bot token, any future API keys) are stored in Secret Manager and NOT in code or config files.
    *   Confirm only necessary Service Accounts have permission to access specific secrets.
6.  **Input Validation Review (Code):**
    *   Briefly review how inputs from external sources (Discord Bot payload, LLM responses) are handled. Ensure Zod validation is used for API inputs. Double-check that LLM output isn't used directly in security-sensitive operations (like forming DB queries - prevented by using Genkit utils).

## Implementation Checklist

*   [ ] **Firestore Rules (`infra/firestore.rules`, Terraform):**
    *   [ ] Review existing rules.
    *   [ ] Refine rules for least privilege access based on flow requirements.
    *   [ ] Test rules in Firestore Rules Simulator.
    *   [ ] `terraform apply` updated rules.
*   [ ] **IAM Roles (`infra/iam.tf`):**
    *   [ ] Review roles granted to `storyteller-sa`, `planner-sa`, `discord-bot-sa`.
    *   [ ] Identify and remove unnecessary permissions.
    *   [ ] Replace broad roles with more specific ones where possible.
    *   [ ] `terraform apply` updated IAM bindings.
*   [ ] **Service Configuration Review:**
    *   [ ] Verify Storyteller CFn requires authentication.
    *   [ ] Verify Planner CFn trigger source (Eventarc).
    *   [ ] Review Cloud Run ingress settings.
*   [ ] **Dependency Scan:**
    *   [ ] Run `npm audit` locally.
    *   [ ] Verify `npm audit` runs in CI pipeline.
    *   [ ] Document/Address any critical vulnerabilities found.
*   [ ] **Secret Management:**
    *   [ ] Audit codebase for any hardcoded secrets (should be none).
    *   [ ] Verify Secret Manager permissions in IAM are correctly restricted.
*   [ ] **Input Validation:**
    *   [ ] Confirm Zod validation is used on Storyteller flow input.
    *   [ ] Spot-check that LLM output isn't used unsafely.

## Verification Steps

*   [ ] Firestore rules are updated and restrict access more tightly than initial basic rules.
*   [ ] IAM roles for service accounts grant fewer, more specific permissions where possible.
*   [ ] `terraform apply` for rules and IAM completes successfully.
*   [ ] Key application flows still function correctly after permission tightening (requires re-running some manual E2E tests or simulation tests).
*   [ ] `npm audit` shows no unaddressed critical/high vulnerabilities.
*   [ ] Cloud Function/Run configurations are verified secure.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Finding the exact minimum required IAM roles can be time-consuming (trial and error sometimes needed).
*   Complexity of Firestore rules required to achieve fine-grained path-based permissions for service accounts.

## Acceptable Tradeoffs

*   Starting with slightly broader IAM roles if finding the absolute minimum proves too difficult, provided they are reviewed.
*   Firestore rules might not cover every single path restriction if complexity becomes excessive, focusing on top-level collection security.
*   Accepting risk for low/moderate severity dependency vulnerabilities if fixes are unavailable or complex.
