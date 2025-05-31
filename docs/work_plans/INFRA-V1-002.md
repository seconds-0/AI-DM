# Work Plan: INFRA-V1-002 - IaC Setup (Terraform: Core App Resources)

*   **Task ID**: INFRA-V1-002
*   **Phase**: 1 - Foundational Setup
*   **Status**: Not Started
*   **Estimate**: 1.5 Days
*   **Author**: Gemini
*   **Dependencies**: INFRA-V1-001 (Core APIs enabled, TF backend setup), GCP Project ready.
*   **Related Docs**: `docs/architecture_v2.md` (Sections 5.4, 5.5, 9.3, 9.4, 10.5)

## Problem Statement

Extend the Terraform configuration to define the core application infrastructure resources required for V1. This includes setting up the Firestore database, defining basic security rules, creating placeholder Cloud Functions v2 for Genkit flows, placeholder Eventarc triggers, placeholder Cloud Run service for the Discord Bot, and necessary IAM service accounts and bindings.

## Components Involved

*   Terraform
*   GCP Firestore
*   GCP Cloud Functions v2
*   GCP Eventarc
*   GCP Cloud Run
*   GCP IAM (Service Accounts, Roles, Bindings)
*   `infra/` directory (extending existing files)

## Proposed Solution / Design Approach

1.  **Firestore:** Define the `google_firestore_database` resource. Create a basic `firestore.rules` file (default deny, allow backend service accounts) and configure its deployment (e.g., via `gcloud` command in `local-exec` or potentially a dedicated TF resource if available/stable).
2.  **IAM Service Accounts:** Create dedicated service accounts for:
    *   Storyteller Cloud Function execution.
    *   Planner Cloud Function execution.
    *   Discord Bot Cloud Run service execution.
3.  **IAM Bindings:** Grant necessary roles to the service accounts:
    *   Function SAs need `roles/datastore.user` (Firestore access), `roles/logging.logWriter`, `roles/monitoring.metricWriter`, `roles/cloudtrace.agent`, `roles/secretmanager.secretAccessor`, potentially `roles/aiplatform.user` (for Gemini), `roles/eventarc.eventReceiver` (for Planner). Ensure they have permission to be invoked (e.g., `roles/run.invoker` for Storyteller HTTPS endpoint).
    *   Bot SA needs `roles/run.invoker` (to call Storyteller), `roles/iam.serviceAccountTokenCreator` (to create identity tokens for calls), roles for accessing necessary APIs like Live Voice, `roles/secretmanager.secretAccessor`, `roles/logging.logWriter`.
4.  **Cloud Functions v2:** Define placeholder `google_cloudfunctions2_function` resources for `storytellerFlow` and `plannerFlow`. Configure basic settings (runtime, region, entry point placeholder, service account). Set trigger types (HTTPS for Storyteller, Eventarc placeholder for Planner).
5.  **Eventarc Trigger:** Define a placeholder `google_eventarc_trigger` resource targeting the Planner function placeholder. Configure event filters (Firestore create on `plannerTasks` path), service account for invocation.
6.  **Cloud Run:** Define a placeholder `google_cloud_run_v2_service` resource for the Discord Bot. Configure basic settings (region, container image placeholder, service account). Set invocation to allow unauthenticated initially for simplicity during setup, or configure IAM invoker policy if needed immediately.
7.  **Firestore Indexes:** Define any obvious initial Firestore indexes (e.g., for `plannerTasks` status/timestamp) using `google_firestore_index` resources.

## Implementation Checklist

*   **Firestore (`infra/firestore.tf`, `infra/firestore.rules`):**
    *   [ ] Define `google_firestore_database` resource (location_id, type NATIVE).
    *   [ ] Create `infra/firestore.rules` with basic rules (e.g., `rules_version = '2'; service cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if false; } match /campaigns/{campaignId} { allow read, write: if request.auth.token.email == ... // SAs ... } ... } }`).
    *   [ ] Add a `null_resource` with `local-exec` provisioner to deploy rules using `gcloud firestore rules deploy infra/firestore.rules --project ${var.project_id}`.
    *   [ ] Define initial `google_firestore_index` resources if any simple query patterns are known (e.g., on `plannerTasks` collection by `status`).
*   **IAM (`infra/iam.tf`):**
    *   [ ] Define `google_service_account` resources for `storyteller-sa`, `planner-sa`, `discord-bot-sa`.
    *   [ ] Define `google_project_iam_member` or `google_project_iam_binding` resources to grant roles:
        *   `storyteller-sa`: `roles/datastore.user`, `roles/logging.logWriter`, `roles/monitoring.metricWriter`, `roles/cloudtrace.agent`, `roles/secretmanager.secretAccessor`, `roles/aiplatform.user`.
        *   `planner-sa`: `roles/datastore.user`, `roles/logging.logWriter`, `roles/monitoring.metricWriter`, `roles/cloudtrace.agent`, `roles/secretmanager.secretAccessor`, `roles/aiplatform.user`, `roles/eventarc.eventReceiver`.
        *   `discord-bot-sa`: `roles/run.invoker` (on storyteller function), `roles/iam.serviceAccountTokenCreator`, `roles/secretmanager.secretAccessor`, `roles/logging.logWriter` (plus any roles needed for Live Voice API - TBD).
*   **Cloud Functions (`infra/functions.tf`):**
    *   [ ] Define `google_cloudfunctions2_function` for `storyteller-flow`:
        *   `location = var.region`
        *   `build_config { runtime = "nodejs20", entry_point = "storytellerHttp" }` (Match exported trigger name)
        *   `service_config { service_account_email = google_service_account.storyteller-sa.email }`
        *   `# HTTPS trigger managed by Genkit deploy`
    *   [ ] Define `google_cloudfunctions2_function` for `planner-flow`:
        *   `location = var.region`
        *   `build_config { runtime = "nodejs20", entry_point = "plannerFirestore" }` (Match exported trigger name)
        *   `service_config { service_account_email = google_service_account.planner-sa.email }`
        *   `# Eventarc trigger defined below`
*   **Eventarc (`infra/eventarc.tf`):**
    *   [ ] Define `google_eventarc_trigger` for `planner-trigger`:
        *   `name = "planner-task-trigger"`
        *   `location = var.region`
        *   `matching_criteria { attribute = "type", value = "google.cloud.firestore.document.v1.written" }`
        *   `matching_criteria { attribute = "database", value = "(default)" }`
        *   `event_data_content_type = "application/json"`
        *   `transport { pubsub { topic = google_pubsub_topic.firestore_trigger_topic.id } }` # Requires creating a topic
        *   `service_account = <EVENTARC_TRIGGER_SA> ` # Eventarc needs its own SA
        *   `destination { cloud_function = google_cloudfunctions2_function.planner-flow.name }` # Use name not ID?
        *   `# Filter on path not directly supported in TF resource? May need to filter in function code.`
*   **PubSub Topic (`infra/eventarc.tf`):**
    *   [ ] Define `google_pubsub_topic` `firestore_trigger_topic`.
    *   [ ] Configure Firestore -> PubSub publishing (May require manual setup or separate `gcloud` command, TF support might be limited/indirect).
*   **Cloud Run (`infra/cloudrun.tf`):**
    *   [ ] Define `google_cloud_run_v2_service` for `discord-bot`:
        *   `location = var.region`
        *   `template { service_account = google_service_account.discord-bot-sa.email }`
        *   `template { containers { image = "gcr.io/cloudrun/placeholder" } }` (Placeholder image)
        *   `ingress = "INGRESS_TRAFFIC_ALL"`
        *   `# Add IAM binding for invoker if needed`
*   **IAM Bindings Update (`infra/iam.tf`):**
    *   [ ] Add `google_cloudfunctions2_function_iam_member` binding for `storyteller-flow` granting `roles/run.invoker` to `discord-bot-sa`.
    *   [ ] Grant Eventarc Trigger SA (`roles/eventarc.serviceAgent`) necessary permissions (e.g., `roles/pubsub.tokenCreator`, `roles/run.invoker` for the target function).
*   [ ] Run `terraform fmt`, `validate`, `plan`, `apply`.
*   [ ] Commit changes.

## Verification Steps

*   [ ] **Command:** `terraform apply` - **Expected:** Completes successfully, reports creation/update of resources.
*   [ ] **Command:** `gcloud firestore databases describe --project <PROJECT_ID>` - **Expected:** Shows Firestore database exists in correct region.
*   [ ] **Command:** `gcloud firestore rules describe --project <PROJECT_ID>` - **Expected:** Shows deployed rules match `firestore.rules`.
*   [ ] **Command:** `gcloud projects get-iam-policy <PROJECT_ID> --flatten="bindings[].members" --format='table(bindings.role)' --filter="bindings.members:<SA_EMAIL>"` (for each SA) - **Expected:** Shows correct roles assigned.
*   [ ] **Command:** `gcloud functions list --project <PROJECT_ID> --regions <REGION>` - **Expected:** Shows `storyteller-flow` and `planner-flow` (or names matching TF resources) potentially in `UPDATE_FAILED` if code not deployed yet.
*   [ ] **Command:** `gcloud eventarc triggers list --project <PROJECT_ID> --location <REGION>` - **Expected:** Shows `planner-trigger` targeting the correct function and PubSub topic.
*   [ ] **Command:** `gcloud run services list --project <PROJECT_ID> --region <REGION>` - **Expected:** Shows `discord-bot` service.
*   [ ] **Command:** `gcloud firestore indexes composite list --project <PROJECT_ID>` (if composite indexes defined) - **Expected:** Shows defined indexes.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   **Eventarc Firestore Trigger Path Filtering:** Terraform resource support for path-based filtering might be limited. May need to filter events within the `planner-flow` function code itself based on the document path in the event payload.
*   **Firestore -> PubSub for Eventarc:** The mechanism for getting Firestore events onto the PubSub topic for Eventarc might require manual setup or `gcloud` commands outside of direct Terraform resources.
*   Exact roles needed for Live Voice API access by the Bot SA? (TBD).
*   Best way to handle CFn invocation permissions (IAM binding vs function config)? (Use IAM binding for Bot -> Storyteller). Eventarc handles Planner invocation.

## Acceptable Tradeoffs

*   Placeholder function entry points and Cloud Run container image.
*   Basic Firestore rules initially.
*   Filtering Eventarc triggers inside the function code if TF resource doesn't support path filtering well.
*   Potentially manual steps for Firestore->PubSub link if TF support is lacking.
