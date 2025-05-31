# Work Plan: DEPLOY-V1-001 - Staging Environment Deployment & Validation

*   **Task ID**: DEPLOY-V1-001
*   **Phase**: 6 - Deployment & Operations (V1)
*   **Status**: Not Started
*   **Estimate**: 1 Day
*   **Author**: Gemini
*   **Dependencies**: SETUP-V1-002 (CI/CD pipeline configured for different envs), All components tested in Dev (Phase 5 completed), Dedicated GCP Staging Project exists, Staging environment configuration (secrets, .tfvars) prepared.
*   **Related Docs**: `docs/architecture_v2.md` (Section 9)

## Problem Statement

Deploy the complete V1 application (Infrastructure via Terraform, Genkit Flows, Discord Bot) to a dedicated Staging GCP project that mirrors the Production environment setup. Validate the deployment and perform final smoke tests before promoting to Production.

## Components Involved

*   CI/CD Pipeline (GitHub Actions)
*   Terraform (Staging configuration)
*   Genkit CLI (Deployment commands in CI/CD)
*   Cloud Functions v2 (Staging)
*   Cloud Run (Staging)
*   Firestore (Staging)
*   Eventarc (Staging)
*   Secret Manager (Staging secrets)
*   Discord Bot (Needs Staging instance configuration)

## Proposed Solution / Design Approach

1.  **Prepare Staging Configuration:**
    *   Create/obtain credentials for a CI/CD Service Account in the Staging GCP project (with necessary permissions, similar to Dev SA but on Staging project).
    *   Configure Workload Identity Federation for the Staging SA.
    *   Create a Terraform variable file (e.g., `staging.tfvars`) specifying the Staging `project_id` and any other environment-specific variables.
    *   Populate secrets (Discord Bot Token for a Staging bot instance, any necessary API keys) in the Staging project's Secret Manager.
2.  **Configure CI/CD for Staging:**
    *   Add a new workflow or job in GitHub Actions specifically for deploying to Staging (e.g., triggered manually or on merges to `main`).
    *   This job should use the Staging project's WIF configuration and Service Account.
    *   The Terraform apply step should use the `staging.tfvars` file.
    *   The `genkit flow deploy` step should target the Staging project.
    *   The Cloud Run deploy step should target the Staging project.
3.  **Execute Staging Deployment:** Trigger the Staging deployment job in the CI/CD pipeline.
4.  **Validation:**
    *   Verify all infrastructure resources (CFn, Cloud Run, Firestore, Eventarc, IAM, Secrets) are created successfully in the Staging GCP project via Terraform.
    *   Verify the Genkit flows (Storyteller, Planner) are deployed successfully to Cloud Functions in Staging.
    *   Verify the Discord Bot container image is deployed and running in Cloud Run in Staging.
    *   Perform a subset of the manual E2E tests (from TEST-V1-004) against the Staging bot instance in the test Discord server.
        *   Focus on core functionality: bot connection, voice join, basic voice interaction loop, `/roll` command.
        *   Check logs in the Staging project's Cloud Logging.
5.  **Troubleshooting:** Address any deployment or configuration errors encountered in the Staging environment.

## Implementation Checklist

*   [ ] **Prepare Staging GCP Environment:**
    *   [ ] Ensure Staging GCP Project exists.
    *   [ ] Create/configure Staging CI/CD Service Account & WIF.
    *   [ ] Grant necessary IAM roles to Staging CI/CD SA on Staging project.
    *   [ ] Create Staging secrets in Secret Manager (Staging Bot Token).
    *   [ ] Create `infra/staging.tfvars` with Staging project ID.
*   [ ] **Update CI/CD Pipeline (`.github/workflows/deploy_staging.yaml` or similar):**
    *   [ ] Create workflow triggered manually (`workflow_dispatch`) or on merge to `main`.
    *   [ ] Configure WIF authentication using Staging SA credentials/provider details.
    *   [ ] Add Terraform job: `terraform apply -var-file=staging.tfvars -auto-approve`.
    *   [ ] Add Genkit deploy job: `genkit flow deploy --platform firebase --project <STAGING_PROJECT_ID> --all`.
    *   [ ] Add Cloud Run deploy job: `gcloud run deploy discord-bot --image ... --region ... --project <STAGING_PROJECT_ID> ...` (Ensure it uses Staging bot config/secrets).
*   [ ] **Execute Deployment:** Trigger the Staging deployment workflow.
*   [ ] **Validation Checks:**
    *   [ ] Review CI/CD job logs for successful completion of all deployment steps.
    *   [ ] Verify resources in Staging GCP Console (CFn, Cloud Run, Firestore, Eventarc, IAM).
    *   [ ] Invite the **Staging Discord Bot** instance to the test server.
    *   [ ] Perform smoke tests:
        *   [ ] Bot logs in successfully.
        *   [ ] Bot joins voice channel.
        *   [ ] Basic voice interaction works (sends audio, receives response).
        *   [ ] `/roll` command works.
    *   [ ] Check basic logs in Staging Cloud Logging.
*   [ ] **Troubleshoot:** Fix any deployment/runtime errors found.

## Verification Steps

*   [ ] CI/CD pipeline successfully deploys all application components (Infra, Flows, Bot) to the Staging GCP project.
*   [ ] Deployed resources are verified to exist and be configured correctly in the Staging environment.
*   [ ] The Staging Discord Bot instance connects and basic functionality (voice interaction, commands) is confirmed via manual smoke testing.
*   [ ] No critical errors are observed in the Staging environment logs during smoke tests.

## Decision Authority

Lead Engineer (self), DevOps

## Questions / Uncertainties

*   Handling environment-specific configurations (e.g., Storyteller URL) for the deployed bot in Staging vs Dev. (Should use env vars set by Cloud Run service config, populated from Staging secrets/config maps).
*   Need a separate Discord Bot application/token for the Staging instance.

## Acceptable Tradeoffs

*   Smoke testing covers only critical paths, not full E2E regression.
*   Initial deployment might require manual tweaks or troubleshooting.
