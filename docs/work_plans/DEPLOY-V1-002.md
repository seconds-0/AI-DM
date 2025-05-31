# Work Plan: DEPLOY-V1-002 - Production Environment Deployment

*   **Task ID**: DEPLOY-V1-002
*   **Phase**: 6 - Deployment & Operations (V1)
*   **Status**: Not Started
*   **Estimate**: 1 Day
*   **Author**: Gemini
*   **Dependencies**: DEPLOY-V1-001 (Successful Staging deployment & validation), CI/CD pipeline configured for Production, Dedicated GCP Production Project exists, Production configuration prepared, Manual approval process defined.
*   **Related Docs**: `docs/architecture_v2.md` (Section 9)

## Problem Statement

Deploy the validated V1 application to the Production GCP environment using the established CI/CD pipeline, incorporating a manual approval step for safety.

## Components Involved

*   CI/CD Pipeline (GitHub Actions with Production stage/job)
*   Terraform (Production configuration)
*   Genkit CLI (Deployment commands)
*   GCP Production Project (CFn, Cloud Run, Firestore, Eventarc, Secrets)
*   Production Discord Bot instance configuration

## Proposed Solution / Design Approach

1.  **Prepare Production Configuration:**
    *   Create/obtain credentials for a CI/CD Service Account in the Production GCP project (with necessary permissions).
    *   Configure Workload Identity Federation for the Production SA.
    *   Create a Terraform variable file (e.g., `production.tfvars`) specifying the Production `project_id`.
    *   Populate secrets (Production Discord Bot Token, etc.) in the Production project's Secret Manager.
2.  **Configure CI/CD for Production:**
    *   Add a Production deployment workflow/job in GitHub Actions.
    *   Trigger this job manually (`workflow_dispatch`) or potentially via Git tags on the `main` branch.
    *   **Crucially:** Add a manual approval step (`environment` with `reviewers`) before the deployment tasks run.
    *   The job should use the Production project's WIF configuration and Service Account.
    *   Terraform apply step uses `production.tfvars`.
    *   Genkit deploy step targets the Production project.
    *   Cloud Run deploy step targets the Production project and uses Production configuration.
3.  **Execute Production Deployment:**
    *   Trigger the Production deployment workflow.
    *   Obtain manual approval when prompted in GitHub Actions.
    *   Monitor the CI/CD pipeline execution closely.
4.  **Validation:**
    *   Verify all resources are created/updated correctly in the Production GCP project.
    *   Perform essential smoke tests with the Production Discord Bot instance (similar to Staging validation, but potentially more limited initially).
    *   Closely monitor Production logs and dashboards (MONITOR-V1-001) immediately following deployment.

## Implementation Checklist

*   [ ] **Prepare Production GCP Environment:**
    *   [ ] Ensure Production GCP Project exists.
    *   [ ] Create/configure Production CI/CD Service Account & WIF.
    *   [ ] Grant necessary IAM roles to Production CI/CD SA on Production project.
    *   [ ] Create Production secrets in Secret Manager (Prod Bot Token).
    *   [ ] Create `infra/production.tfvars` with Production project ID.
*   [ ] **Update CI/CD Pipeline (`.github/workflows/deploy_prod.yaml` or similar):**
    *   [ ] Create workflow triggered manually (`workflow_dispatch`) or by tag (e.g., `tags: [ v* ]`).
    *   [ ] Define a deployment `environment` (e.g., `name: production`, `url: <optional_prod_url>`) with required reviewers.
    *   [ ] Configure WIF authentication using Production SA.
    *   [ ] Add Terraform job: `terraform apply -var-file=production.tfvars -auto-approve` (runs after approval).
    *   [ ] Add Genkit deploy job: `genkit flow deploy --platform firebase --project <PROD_PROJECT_ID> --all` (runs after approval).
    *   [ ] Add Cloud Run deploy job: `gcloud run deploy discord-bot --image ... --project <PROD_PROJECT_ID> ...` (runs after approval, uses Prod bot config/secrets).
*   [ ] **Execute Deployment:**
    *   [ ] Trigger the Production deployment workflow (e.g., manually run or push tag).
    *   [ ] Approve the deployment when prompted in GitHub Actions.
    *   [ ] Monitor CI/CD job logs.
*   [ ] **Validation Checks:**
    *   [ ] Verify resources in Production GCP Console.
    *   [ ] Invite the **Production Discord Bot** instance to the target Discord server(s).
    *   [ ] Perform minimal smoke tests (e.g., bot connects, responds to a basic command).
    *   [ ] Monitor Production Cloud Logging/Monitoring dashboards closely.
*   [ ] **Rollback Plan (Mental/Documented):** Understand how to quickly revert (e.g., re-deploy previous tag/commit, manually disable services) if critical issues arise post-deployment.

## Verification Steps

*   [ ] Production deployment workflow requires and receives manual approval.
*   [ ] CI/CD pipeline successfully deploys all components to the Production GCP project.
*   [ ] Production resources are verified in GCP console.
*   [ ] Production Discord Bot connects and basic functionality is confirmed via smoke testing.
*   [ ] Initial monitoring shows no critical errors in Production.

## Decision Authority

Lead Engineer (self), Key Stakeholders (for approval)

## Questions / Uncertainties

*   Final approval process for Production deployment.
*   Need Production Discord Bot application/token.

## Acceptable Tradeoffs

*   Minimal initial smoke testing in Production, relying heavily on Staging validation.
*   Basic rollback plan initially.
