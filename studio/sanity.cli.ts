import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: { projectId: "ok5py3p6", dataset: "production" },
  // the studio is hosted by Sanity at https://margate-arts-club.sanity.studio
  studioHost: "margate-arts-club",
  deployment: { appId: "luoa2bv1i4es9drxyv7p9vmt" },
});
