import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

// KV holds Next's cache. The queue is what refreshes a page once its minute is up (without one, a page stays as it was built until
// the next deploy, so Sanity edits and new events would never appear): the in-memory one is enough for this site's traffic
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  queue: memoryQueue,
});
