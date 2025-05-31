# Work Plan: INFRA-V1-001 - IaC Setup (Terraform: Core GCP Project Resources)

*   **Task ID**: INFRA-V1-001
*   **Phase**: 1 - Foundational Setup
*   **Status**: Not Started
*   **Estimate**: 1 Day
*   **Author**: Gemini
*   **Dependencies**: GCP Project created, Billing enabled, Terraform CLI installed, appropriate GCP permissions.
*   **Related Docs**: `docs/architecture_v2.md`

## Problem Statement

Set up the foundational Infrastructure as Code (IaC) using Terraform to manage core Google Cloud Platform (GCP) resources. This includes configuring the Terraform backend, enabling essential APIs, setting up Artifact Registry for potential container images, and creating placeholder resources for Secret Manager.

## Components Involved

*   Terraform CLI
*   GCP Project
*   GCP Service Usage API
*   GCP Artifact Registry
*   GCP Secret Manager
*   GCP Cloud Storage (GCS) - for Terraform state
*   `infra/` directory in the repository

## Proposed Solution / Design Approach

1.  Initialize Terraform within the `infra/` directory.
2.  Configure the Terraform backend to use a GCS bucket for remote state storage (requires manually creating the bucket first or bootstrapping it).
3.  Configure the Google provider for Terraform.
4.  Define resources to enable necessary GCP APIs required for the project (e.g., Cloud Functions, Cloud Run, Eventarc, Firestore, Secret Manager, Artifact Registry, IAM, Cloud Build, Cloud Logging, Cloud Monitoring, AI Platform/Vertex AI for Gemini).
5.  Define an Artifact Registry repository (e.g., for the Discord Bot Docker image later).
6.  Define placeholder Secret Manager secrets for storing API keys and sensitive configuration (e.g., `DISCORD_BOT_TOKEN`, `OPENAI_API_KEY` - even if OpenAI is deferred, set up placeholder). Actual secret *versions* will be added manually or via a separate secure process.
7.  Structure Terraform code using standard practices (e.g., `main.tf`, `variables.tf`, `outputs.tf`).

## Implementation Checklist

*   [ ] Ensure Terraform CLI is installed.
*   [ ] **Manually create a GCS bucket** to store Terraform state (e.g., `my-project-tfstate-bucket`). Ensure versioning is enabled on the bucket. (Requires manual verification via console/gsutil).
*   [ ] Create `infra/` directory in the project root.
*   [ ] Create `infra/main.tf`:
    *   [ ] Configure Terraform block with GCS backend (using the manually created bucket name).
    *   [ ] Configure Google provider (specify project ID, region).
*   [ ] Create `infra/variables.tf`:
    *   [ ] Define variables for `project_id`, `region`, `gcs_state_bucket`.
*   [ ] Create `infra/terraform.tfvars` (and add to `.gitignore`):
    *   [ ] Set values for `project_id`, `region`, `gcs_state_bucket`.
*   [ ] Run `terraform init -backend-config=gcs_state_bucket=<BUCKET_NAME>` in the `infra/` directory.
*   [ ] In `infra/main.tf` (or a dedicated `apis.tf`):
    *   [ ] Define `google_project_service` resources to enable:
        *   `iam.googleapis.com`
        *   `cloudresourcemanager.googleapis.com`
        *   `serviceusage.googleapis.com`
        *   `artifactregistry.googleapis.com`
        *   `secretmanager.googleapis.com`
        *   `run.googleapis.com` (Cloud Run)
        *   `cloudfunctions.googleapis.com` (Cloud Functions)
        *   `eventarc.googleapis.com` (Eventarc)
        *   `firestore.googleapis.com` (Firestore)
        *   `logging.googleapis.com` (Logging)
        *   `monitoring.googleapis.com` (Monitoring)
        *   `cloudbuild.googleapis.com` (Cloud Build for CI/CD)
        *   `aiplatform.googleapis.com` (Vertex AI - for Gemini models)
        *   `iamcredentials.googleapis.com` (For generating identity tokens)
*   [ ] In `infra/main.tf` (or a dedicated `artifact_registry.tf`):
    *   [ ] Define a `google_artifact_registry_repository` resource (e.g., format DOCKER, name `discord-bot-repo`).
*   [ ] In `infra/main.tf` (or a dedicated `secrets.tf`):
    *   [ ] Define `google_secret_manager_secret` resources for planned secrets (e.g., `discord-bot-token`). **Do not define `google_secret_manager_secret_version` here.**
*   [ ] Create `infra/outputs.tf` (e.g., output Artifact Registry repository URL).
*   [ ] Run `terraform fmt` to format the code.
*   [ ] Run `terraform validate` to check syntax.
*   [ ] Run `terraform plan -out=tfplan` to review planned changes.
*   [ ] Run `terraform apply tfplan` to create the resources.
*   [ ] Commit Terraform files to Git (ensure `.tfvars` and `.terraform/` directory are ignored).

## Verification Steps

*   [ ] **Command:** `terraform init -backend-config=...` - **Expected:** Completes successfully, initializes backend.
*   [ ] **Command:** `terraform validate` - **Expected:** Completes successfully.
*   [ ] **Command:** `terraform apply tfplan` - **Expected:** Completes successfully, reports creation of resources.
*   [ ] **Command:** `gcloud services list --project <PROJECT_ID> --enabled` - **Expected:** Output includes all the APIs listed in checklist.
*   [ ] **Command:** `gcloud artifacts repositories list --project <PROJECT_ID> --location <REGION>` - **Expected:** Output includes the created `discord-bot-repo` repository.
*   [ ] **Command:** `gcloud secrets list --project <PROJECT_ID>` - **Expected:** Output includes the created placeholder secrets (e.g., `discord-bot-token`).
*   [ ] **Command:** `gsutil ls gs://<GCS_STATE_BUCKET>/default.tfstate` - **Expected:** Command succeeds, confirming state file exists in GCS bucket.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Need confirmation of exact list of required APIs. (List provided is comprehensive based on architecture).
*   Secure handling of adding actual secret *versions*. (This process is outside this TF setup - requires manual Console input or a secure script run locally).

## Acceptable Tradeoffs

*   Manual creation of the GCS state bucket (common practice for bootstrapping).
*   Secrets defined are placeholders; versions must be added manually/securely later.
