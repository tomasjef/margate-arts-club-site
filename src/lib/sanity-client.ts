import { createClient } from "@sanity/client";

// Only used to check the studio's preview request (see app/api/draft-mode/enable); the pages read through lib/cms.ts
export const client = createClient({ projectId: "ok5py3p6", dataset: "production", apiVersion: "2025-10-01", useCdn: false });
