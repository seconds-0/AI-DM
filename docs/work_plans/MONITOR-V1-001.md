# Work Plan: MONITOR-V1-001 - Monitoring & Alerting Implementation

*   **Task ID**: MONITOR-V1-001
*   **Phase**: 5 - Integration, Testing & Refinement (V1)
*   **Status**: Not Started
*   **Estimate**: 1.5 Days
*   **Author**: Gemini
*   **Dependencies**: INFRA-V1-001, INFRA-V1-002 (Core infra, Logging enabled), CORE-V1-001 (Structured Logger), All flows/bot deployed to at least Dev env.
*   **Related Docs**: `docs/architecture_v2.md` (Section 11), Google Cloud Monitoring Documentation.

## Problem Statement

Implement monitoring dashboards and alerting policies in Google Cloud Monitoring to provide visibility into the health, performance, and error rates of the deployed application components (Cloud Functions, Cloud Run, Firestore, key external APIs). Ensure Genkit traces are effectively integrated and viewable.

## Components Involved

*   Google Cloud Monitoring (Metrics Explorer, Dashboards, Alerting)
*   Google Cloud Logging (for logs-based metrics & traces)
*   Terraform (`google_monitoring_dashboard`, `google_monitoring_alert_policy` resources)
*   Genkit Tracing data (viewed via Firebase Studio / Cloud Trace)
*   Application Logs (from Logger in CORE-V1-001)

## Proposed Solution / Design Approach

1.  **Identify Key Metrics:** Based on Architecture section 11.3, confirm the critical metrics to monitor for V1:
    *   Cloud Functions (Storyteller, Planner): Invocation count, Error rate (by type), Execution time/latency (p50, p95, p99).
    *   Cloud Run (Discord Bot): Instance count, CPU/Memory utilization, Request latency (if applicable - less relevant for bot), Container crash count.
    *   Firestore: Read/Write operation count, Latency.
    *   Gemini API / Live Voice API: Call count, Error rate, Latency (where available as standard metrics).
2.  **Configure Genkit Trace Viewing:** Ensure Genkit traces are flowing correctly and are easily viewable within Firebase Studio or Google Cloud Trace. Verify standard metadata (`campaignId`, `userId`, `flowStep`, etc. - defined in STYLE-V1-001) is being included in traces where applicable.
3.  **Create Monitoring Dashboard (Terraform):** Define a `google_monitoring_dashboard` resource in Terraform.
    *   Add widgets (time series charts, scorecards) to display the key metrics identified above for Cloud Functions, Cloud Run, Firestore, and relevant API usage.
    *   Organize the dashboard logically (e.g., sections for Bot, Storyteller Flow, Planner Flow, Database).
4.  **Define Alerting Policies (Terraform):** Define `google_monitoring_alert_policy` resources in Terraform for critical conditions:
    *   High error rate for Storyteller or Planner functions (> X% over Y mins).
    *   High latency for Storyteller function (> Z sec p95 over Y mins).
    *   High error rate for Gemini or Live Voice API calls (if metrics available).
    *   Discord Bot (Cloud Run) container crashing frequently.
    *   High Firestore latency or error rate.
    *   (Optional) Logs-based alerts for specific critical error messages.
5.  **Configure Notification Channels:** Manually configure notification channels in Cloud Monitoring (e.g., Email, Slack, PagerDuty) and associate them with the alerting policies defined in Terraform.
6.  **Testing Alerts:** Temporarily lower alert thresholds or manually trigger error conditions (if feasible without impacting users) in a Dev/Staging environment to verify that alerts fire and notifications are received.

## Implementation Checklist

*   [ ] **Verify Genkit Tracing:**
    *   [ ] Invoke deployed flows (Dev/Staging).
    *   [ ] Check Firebase Studio / Cloud Trace to ensure traces are captured.
    *   [ ] Verify traces contain expected metadata (from logger/trace calls).
*   [ ] **Create Terraform Dashboard (`infra/dashboard.tf`):**
    *   [ ] Define `google_monitoring_dashboard` resource.
    *   [ ] Add widgets using MQL or standard metric filters for:
        *   Storyteller/Planner Function Invocation Count & Error Rate.
        *   Storyteller Function Latency (p50/p95).
        *   Discord Bot CPU/Memory Usage & Instance Count.
        *   Firestore Read/Write Op Count & Latency.
        *   Gemini/Voice API Call Count & Error Rate (if available).
    *   [ ] Apply Terraform changes.
    *   [ ] Verify dashboard appearance in Cloud Monitoring Console.
*   [ ] **Create Terraform Alert Policies (`infra/alerts.tf`):**
    *   [ ] Define `google_monitoring_alert_policy` resources for key conditions (high function errors/latency, high API errors, bot crashes, high DB latency).
    *   [ ] Set appropriate aggregation periods, thresholds, and duration.
    *   [ ] Reference notification channels by ID (requires manual creation first).
    *   [ ] Apply Terraform changes.
*   [ ] **Configure Notification Channels (Manual):**
    *   [ ] In GCP Console -> Monitoring -> Alerting -> Notification Channels, create desired channels (e.g., email distribution list).
    *   [ ] Note the generated channel IDs.
    *   [ ] Update Terraform alert policy resources with the correct channel IDs.
    *   [ ] Re-apply Terraform.
*   [ ] **Test Alerts:**
    *   [ ] (Optional/Carefully) In Dev/Staging, temporarily lower an alert threshold (e.g., function error rate).
    *   [ ] Trigger the condition (e.g., invoke flow with bad data causing errors).
    *   [ ] Verify the alert fires in Cloud Monitoring.
    *   [ ] Verify notification is received via the configured channel.
    *   [ ] Restore original alert threshold.

## Verification Steps

*   [ ] Monitoring dashboard exists in Cloud Monitoring and displays relevant V1 metrics.
*   [ ] Alerting policies for critical conditions are created and enabled.
*   [ ] Notification channels are configured and linked to policies.
*   [ ] Genkit traces are visible and contain useful metadata.
*   [ ] Test alert successfully triggers a notification.
*   [ ] Terraform code for monitoring/alerting is committed.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Availability and granularity of standard metrics for Live Voice API.
*   Specific thresholds for alerting policies (requires observation and tuning).
*   Best way to test alerts without causing real issues (manual threshold adjustment seems feasible in dev).

## Acceptable Tradeoffs

*   Starting with a basic set of metrics and alerts, refining later based on operational experience.
*   Manual configuration of notification channels.
*   Relying on subjective alert testing initially.
