# Work Plan: DEPLOY-V1-003 - Operational Runbook & Backup/Restore Procedures

*   **Task ID**: DEPLOY-V1-003
*   **Phase**: 6 - Deployment & Operations (V1)
*   **Status**: Not Started
*   **Estimate**: 1 Day
*   **Author**: Gemini
*   **Dependencies**: All components deployed (DEPLOY-V1-001, DEPLOY-V1-002), Monitoring implemented (MONITOR-V1-001), INFRA-V1-002 (Backup strategy defined conceptually).
*   **Related Docs**: `docs/architecture_v2.md`, `docs/RUNBOOK.md` (New File), `docs/BACKUP_RESTORE.md` (New File).

## Problem Statement

Document essential operational procedures in a runbook, including how to monitor the application, diagnose common issues, and perform basic operational tasks. Additionally, document the procedures for backing up and restoring Firestore data.

## Components Involved

*   `docs/RUNBOOK.md` (New documentation file)
*   `docs/BACKUP_RESTORE.md` (New documentation file)
*   Google Cloud Monitoring / Firebase Studio (Tools used in procedures)
*   Google Cloud Logging (Tools used in procedures)
*   `gcloud` CLI (For potential manual operations like restore)
*   Terraform (For infrastructure context)

## Proposed Solution / Design Approach

1.  **Create Runbook (`docs/RUNBOOK.md`):**
    *   **Overview:** Briefly describe the application architecture and key components (link to `architecture_v2.md`).
    *   **Monitoring:** Explain how to access and interpret key dashboards in Cloud Monitoring / Firebase Studio. List critical metrics and their expected ranges.
    *   **Logging & Tracing:** Explain how to query logs in Cloud Logging (mention key fields like `campaignId`, `traceId`) and how to view traces in Firebase Studio / Cloud Trace.
    *   **Common Issues & Diagnosis:** Document potential common problems (e.g., Bot unresponsive, voice issues, flow errors) and provide initial diagnostic steps (e.g., check Cloud Function logs for Storyteller errors, check Cloud Run logs for Bot errors, check API quotas, check Firestore status).
    *   **Alerting:** List key alerts (from MONITOR-V1-001) and the expected response procedure for each.
    *   **Deployments:** Link to CI/CD process for Staging/Production deployments.
    *   **Restarting Services:** Document how to manually restart the Discord Bot Cloud Run service if necessary.
    *   **Scaling:** Briefly mention auto-scaling nature of CFn/Cloud Run.
2.  **Create Backup & Restore Guide (`docs/BACKUP_RESTORE.md`):**
    *   **Backup Strategy:** Detail the strategy (rely on Firestore PITR for short-term, scheduled exports for long-term - based on INFRA-V1-002).
    *   **Scheduled Exports (If Implemented):** Document the Cloud Scheduler job configuration (managed via Terraform) and the target GCS bucket for exports.
    *   **PITR Restore Procedure:** Outline the steps to restore Firestore to a point in time using `gcloud firestore restore` command, referencing GCP documentation. Emphasize prerequisites (PITR enabled) and potential impacts.
    *   **Export Restore Procedure:** Outline steps to import data from a GCS backup using `gcloud firestore import` command. Include considerations for importing into an existing or new database.

## Implementation Checklist

*   [ ] Create `docs/RUNBOOK.md`.
*   [ ] Populate Runbook Sections:
    *   [ ] Overview & Architecture Links.
    *   [ ] Monitoring Dashboards (Screenshots helpful, link to dashboards).
    *   [ ] Logging/Tracing Queries (Example queries for common issues).
    *   [ ] Common Issues & Diagnostic Steps.
    *   [ ] Alert Response Procedures.
    *   [ ] Deployment Links.
    *   [ ] Restart Procedures.
*   [ ] Create `docs/BACKUP_RESTORE.md`.
*   [ ] Populate Backup & Restore Sections:
    *   [ ] Backup Strategy Summary (PITR, Exports).
    *   [ ] Scheduled Export Config Details (if applicable).
    *   [ ] PITR Restore Steps (using `gcloud firestore restore`).
    *   [ ] Export Restore Steps (using `gcloud firestore import`).
*   [ ] Review documents for clarity and accuracy.
*   [ ] Commit documents to the repository.

## Verification Steps

*   [ ] `RUNBOOK.md` exists and covers key operational areas.
*   [ ] `BACKUP_RESTORE.md` exists and accurately describes the backup strategy and restore procedures.
*   [ ] Procedures outlined are consistent with the implemented architecture and monitoring setup.
*   [ ] Documents are clear and understandable for someone needing to operate/troubleshoot the application.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Final configuration details of scheduled exports if implemented.
*   Need to test restore procedures (potentially in a non-prod environment) to ensure accuracy of documentation.

## Acceptable Tradeoffs

*   Runbook may not cover every conceivable failure mode initially.
*   Restore procedure documentation relies heavily on GCP standard procedures.
*   Actual testing of restore procedures might be deferred.
