# Work Plan: SETUP-V1-002 - Basic CI/CD Pipeline (GitHub Actions)

*   **Task ID**: SETUP-V1-002
*   **Phase**: 1 - Foundational Setup
*   **Status**: Not Started
*   **Estimate**: 1 Day
*   **Author**: Gemini
*   **Dependencies**: SETUP-V1-001 (Repo, npm scripts), INFRA-V1-001, INFRA-V1-002 (Terraform setup), GitHub repository created, GCP Service Account for CI/CD with necessary permissions, Workload Identity Federation configured between GitHub Actions and GCP.
*   **Related Docs**: `docs/architecture_v2.md` (Section 9.6)

## Problem Statement

Implement a basic Continuous Integration and Continuous Deployment (CI/CD) pipeline using GitHub Actions. This pipeline should automatically lint, build, and run placeholder tests on code pushes/PRs. It should also include steps to deploy the Terraform-managed infrastructure to a development environment.

## Components Involved

*   GitHub Actions (`.github/workflows/ci.yaml`)
*   Node.js environment (in Actions runner)
*   npm scripts (from `package.json`)
*   Terraform CLI (in Actions runner)
*   Google Cloud SDK (`gcloud`) (in Actions runner)
*   GCP Workload Identity Federation
*   GCP Service Account (for CI/CD)

## Proposed Solution / Design Approach

1.  **Configure Workload Identity Federation:** Set up WIF in GCP to allow GitHub Actions workflows from the specific repository/branch to securely impersonate a GCP Service Account without needing static credentials.
2.  **Create CI/CD Service Account:** Create a dedicated GCP Service Account for the CI/CD pipeline.
3.  **Grant Permissions:** Grant the CI/CD SA necessary roles to apply Terraform (e.g., `roles/owner` on the Dev project for simplicity, or more granular roles like `roles/storage.admin`, `roles/iam.serviceAccountAdmin`, `roles/cloudfunctions.developer`, `roles/run.admin`, `roles/eventarc.admin`, `roles/secretmanager.admin`, `roles/datastore.owner`, `roles/artifactregistry.writer`, etc.) and potentially deploy Genkit flows later (`roles/firebase.deployer`?).
4.  **Create GitHub Actions Workflow:**
    *   Define a workflow file (`.github/workflows/ci.yaml`).
    *   Trigger on pushes to `develop` branch and pull requests targeting `develop`.
    *   **`build_and_test` Job:** Checks out code, sets up Node.js, installs dependencies (`npm ci`), runs linters (`npm run lint`), compiles TypeScript (`npm run build`), runs placeholder unit tests (`npm run test`).
    *   **`deploy_dev_infra` Job:** (Runs only on push to `develop`)
        *   Checks out code.
        *   Authenticates to GCP using WIF (`google-github-actions/auth`).
        *   Sets up Terraform CLI.
        *   Runs `terraform init`, `terraform validate`, `terraform apply -auto-approve` within the `infra/` directory, targeting the Dev environment configuration.

## Implementation Checklist

*   **GCP Setup:**
    *   [ ] Follow GCP documentation to configure Workload Identity Federation for GitHub Actions (Pool, Provider, link to GitHub repo/branch).
    *   [ ] Create a dedicated GCP Service Account (e.g., `github-actions-cicd-sa`).
    *   [ ] Grant the `github-actions-cicd-sa` the necessary IAM roles on the **Dev Project** to manage all resources defined in Terraform (e.g., start with Project Owner for dev simplicity, refine later if needed).
    *   [ ] Allow the GitHub WIF identity to impersonate `github-actions-cicd-sa` (grant `roles/iam.workloadIdentityUser`).
*   **GitHub Actions Workflow (`.github/workflows/ci.yaml`):**
    *   [ ] Create the workflow file.
    *   [ ] Define `name: CI/CD`.
    *   [ ] Define `on:` triggers: `push: { branches: [ develop ] }, pull_request: { branches: [ develop ] }`.
    *   [ ] Define permissions for `id-token: write`, `contents: read`.
    *   [ ] **`build_and_test` Job:**
        *   `runs-on: ubuntu-latest`
        *   `steps:`
            *   `uses: actions/checkout@v4`
            *   `uses: actions/setup-node@v4` with Node.js LTS version.
            *   `run: npm ci`
            *   `run: npm run lint`
            *   `run: npm run build --if-present`
            *   `run: npm run test --if-present` (Will run placeholder initially)
    *   [ ] **`deploy_dev_infra` Job:**
        *   `runs-on: ubuntu-latest`
        *   `needs: build_and_test`
        *   `if: github.ref == 'refs/heads/develop' && github.event_name == 'push'`
        *   `steps:`
            *   `uses: actions/checkout@v4`
            *   `id: auth`
            *   `uses: google-github-actions/auth@v2`
            *   `with:`
                *   `workload_identity_provider: projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/<POOL_ID>/providers/<PROVIDER_ID>`
                *   `service_account: github-actions-cicd-sa@<PROJECT_ID>.iam.gserviceaccount.com`
            *   `uses: hashicorp/setup-terraform@v3`
            *   `working-directory: infra`
            *   `run: terraform init`
            *   `run: terraform validate`
            *   `run: terraform apply -auto-approve -var="project_id=<DEV_PROJECT_ID>"` (Pass Dev project ID explicitly)
*   [ ] Commit the workflow file to `.github/workflows/`.
*   [ ] Configure GitHub branch protection rules for `develop` branch (e.g., require status checks like `build_and_test` to pass before merging).

## Verification Steps

*   [ ] **CI Check:** Verify `build_and_test` job completes successfully in GitHub Actions on pull requests to `develop`.
*   [ ] **CI Check:** Verify `build_and_test` job completes successfully in GitHub Actions on pushes to `develop`.
*   [ ] **CI Check:** Verify `deploy_dev_infra` job completes successfully **only** on pushes to `develop` in GitHub Actions logs.
*   [ ] **CI Check:** Verify `terraform apply` step logs in the `deploy_dev_infra` job show successful application of infrastructure changes.
*   [ ] **CI Check:** Verify logs for the `google-github-actions/auth` step show successful authentication using WIF (no static keys logged).

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Exact WIF Pool/Provider IDs and Project Number needed for `google-github-actions/auth` step.
*   Refining the exact granular IAM roles for the CI/CD SA instead of Project Owner (Postpone refinement if Owner works initially for Dev).
*   Strategy for handling different environment configurations in Terraform (e.g., separate `.tfvars` files, workspaces). (Assume passing `project_id` via `-var` for now).

## Acceptable Tradeoffs

*   Using broader IAM permissions (Project Owner) for the CI/CD SA in the Dev environment initially.
*   Placeholder unit tests pass trivially.
*   Deployment only covers Terraform infrastructure initially; code deployment (Genkit flows, Bot image) will be added in later work plans/pipeline stages.
*   Simple environment handling via `-var` for now.
