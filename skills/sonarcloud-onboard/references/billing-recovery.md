# Billing failure recovery

Read this only after a subscription lookup, signup, or verification fails. Preserve the existing organization, GitHub binding and any project. A failed billing request does not prove there is no subscription. Never submit a duplicate subscription POST to diagnose an uncertain result.

## Classify and inspect once

Record the failed method and endpoint, HTTP status, organization key, and timestamp with timezone. Read the entire stderr stream: `step_failed` may omit the diagnostic naming `GET` or `POST /billing/subscriptions`.

- **401:** credentials may be rejected by billing. In CLI mode, allow one forced Cloud login, combining `--org "$ORG_KEY"` with it once the organization is known; then retry the failed read. A second 401 stops the flow. A later 404 is a distinct billing problem, not grounds for another login. In MCP mode, first use the v1/v2 authorization diagnostic in `mcp-onboarding.md`; avoid repeated client reconnects for a split authorization result.
- **404 on a new organization:** the organization/subscription may not have propagated, or billing may have a service/routing fault. Do not classify it as confirmed absence. Run the bounded read-only retry below; if it remains 404, stop billing setup and report the fault. A POST 404 does not authorize repeated signup attempts.
- **403 or other failures:** report permissions or connectivity/service errors; do not change plans, credentials or organization bindings speculatively.

Allow this specific read-only diagnostic after the failure, using the same authenticated backend and dev9 overrides:

```sh
# ORG_KEY is URL-encoded for the query. E is the function from SKILL.md.
E api get "/api/organizations/search?organizations=$ORG_KEY"
```

In MCP mode, use a read-only tool only if its actual schema exposes this organization record and plan. The current `discover_github_repository` response contains binding/access information, not the v1 `subscription` field. If the deployment has no tool for this diagnostic, report that limitation; do not invent a tool or infer a plan from binding alone. Offer CLI diagnosis only under the backend-switch rule. Without verified plan evidence, this fallback is unavailable.

Find the exact organization key and inspect its GitHub binding, admin access, and `subscription` field. For example, `subscription: FREE` is evidence of the v1 organization's reported plan; it does not verify a Team trial, billing activation, expiry or payment-method state. Do not browse unrelated billing endpoints, retrieve payment data, or expose tokens.

## Bounded read-only billing retry

CLI: reuse the organization's actual UUID from prior successful lookup/output, or resolve it with `E api get "/organizations/organizations?organizationKey=$ORG_KEY&excludeEligibility=true"` and read `uuidV4` from the exact organization record in the returned array. Do not pass the organization key as a UUID or guess it. The subscription status check uses:

```sh
E api get "/billing/subscriptions?resourceId=$ORG_UUID&resourceType=organization"
```

This is v2 on `API_SERVER`; the CLI routes `/billing/...` there. Use GET only. After an uncertain signup result, do not rerun `org import` merely to poll billing: it may submit another POST. Inspect the returned subscription before any continuation, preserving its actual plan.

MCP: use `ensure_cloud_subscription` with the same `organizationKey` and plan plus **`createIfMissing: false`**. This is a status check, with no new signup. It must be available in the connected deployment; do not invent a generic billing tool if it is missing.

For a new organization with delayed visibility, retry the same read after 10, 20, 40 and then 60 seconds between checks, honoring a longer server retry hint without exceeding **10 minutes from the first failure**. Keep the user informed through monitored short waits. On success, verify the subscription/trial as in the normal workflow. A successful empty response, a missing UUID, or persistent 404 leaves billing unverified; do not treat any as permission to create another subscription. For an established organization, persistent 404 is a service fault, not a new-organization propagation excuse.

## Consent to continue on an already reported plan

If billing remains unreachable but `/api/organizations/search` reports the exact GitHub-bound organization with `subscription: FREE` (or another existing plan), offer the user this explicit choice before continuing:

> Billing could not be verified for `<org>`. The organization API reports `<plan>`. May I continue on that existing plan to import/analyze `<owner/repo>`, without starting a trial or changing the subscription?

Wait for consent. This is a deviation from the trial workflow; onboarding authorization alone does not authorize this fallback. `org import --plan free` is not a workaround: existing-subscription lookup happens before plan handling, so it can fail with the same 404.

With consent, preserve the reported plan and confirmed binding; skip subscription creation and `org import`. In CLI mode, check/select the organization using the supported selection/login route in `SKILL.md`, then recheck auth status before `import`. In MCP mode, pass the exact organization key directly to repository import. Verify repository access, project visibility/entitlements and analysis eligibility through the normal commands; this fallback does not bypass those checks or guarantee analysis. If any prerequisite fails, stop and report it. If there is no confirmed plan or binding, or the user declines, stop setup and report the incomplete stage. Do not fabricate a trial or manually select a paid price.

## Failure report

Include environment/web and API hosts, organization key (UUID if already known), failed method and endpoint, HTTP status, first/last attempt time with timezone, retry duration, and any request/correlation ID actually returned. State completed steps, the v1 reported plan if available, whether signup was attempted or its outcome is uncertain, and whether the user consented to the fallback. Summarize the diagnostic without credentials, personal/payment data or raw token-bearing URLs. Link the existing organization dashboard on the selected web host and explain what is blocked and what an operator needs to investigate.
