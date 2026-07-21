# OTEC Resolution Frontend

The authenticated `/otec-compliance/resolutions` workspace provides tenant-scoped list, detail, create, edit, deactivation, and supersession flows. The frontend obtains the active OTEC profile from the authenticated singleton query and never accepts organization, tenant, or actor identity from form input.

Updates and deactivation send the response-bound `ETag` as `If-Match`. Supersession sends both the replaced record `If-Match` and the replacement `replacementIfMatch`. A stale mutation is not retried, preserves the local draft, reports the conflict, and refetches the current server version. Destructive lifecycle changes require an accessible confirmation dialog.

Read permission is required to render the workspace. Resolution management actions are disabled without `otec_compliance.resolution.manage`. All displayed information is internal evidence and does not claim official regulatory validation.
