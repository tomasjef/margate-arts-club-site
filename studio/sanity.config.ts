import { createElement, Fragment } from "react";
import { defineConfig, type DocumentActionComponent, type LayoutProps } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemaTypes";
import { SubscriberNumbers } from "./SubscriberNumbers";

// Documents the club edits one of: the site settings, the menu, Visit, Music, About, Privacy and Accessibility. They have fixed ids so the
// site can find each one, and cannot be created twice or deleted. Other pages the club adds are in "Other".
const singletons: { id: string; title: string; type: string; group?: "legal" }[] = [
  { id: "siteSettings", title: "Opening hours and footer", type: "siteSettings" },
  { id: "menu", title: "Menu", type: "menu" },
  // the three pages in the order the club has them in the menu (About, Sound, Visit; Sanity's Menu folder has the live order)
  { id: "page-about", title: "About", type: "page" },
  { id: "page-music", title: "Sound", type: "page" },
  { id: "page-visit", title: "Visit", type: "page" },
  { id: "legal-privacy", title: "Privacy", type: "legalPage", group: "legal" },
  { id: "legal-accessibility", title: "Accessibility", type: "legalPage", group: "legal" },
  { id: "legal-company", title: "Company", type: "companyDetails", group: "legal" },
  { id: "newsletter", title: "Newsletter", type: "newsletter" },
];
const fixedIds = singletons.map((s) => s.id);

const isFixed = (id?: string) => fixedIds.includes(String(id ?? "").replace(/^drafts\./, ""));

// Editing kept simple: opening something shows what is there now, changes are kept to one side until Save puts them live, and Cancel
// changes (under the ⋯ beside Save) drops them. So Publish is called Save, Discard changes is Cancel changes, and the Published / Draft
// chips at the top of a document are hidden (Sanity has no setting for them; this hides them by their test id, so check after upgrading Sanity).
const words: Record<string, [string, string][]> = {
  publish: [["Publishing", "Saving"], ["Published", "Saved"], ["Publish", "Save"]],
  discardChanges: [["Discard changes", "Cancel changes"]],
};
const renamed = new WeakMap<DocumentActionComponent, DocumentActionComponent>();
function rename(Action: DocumentActionComponent) {
  const pairs = Action.action && words[Action.action];
  if (!pairs) return Action;
  // one wrapper for each built-in action, made once, so the studio sees the same action every time
  let Renamed = renamed.get(Action);
  if (!Renamed) {
    const Wrapped: DocumentActionComponent = (props) => {
      const result = Action(props);
      if (!result || typeof result.label !== "string") return result;
      return { ...result, label: pairs.reduce((label, [from, to]) => label.replace(from, to), result.label) };
    };
    Wrapped.action = Action.action;
    Wrapped.displayName = Action.displayName;
    renamed.set(Action, Wrapped);
    Renamed = Wrapped;
  }
  return Renamed;
}
const hideVersionChips = '[data-testid="document-perspective-list"]{display:none!important}';

export default defineConfig({
  name: "default",
  title: "Margate Arts Club",
  projectId: "ok5py3p6",
  dataset: "production",
  plugins: [
    // No Presentation (the live preview beside the form): the club found it confusing (2 Nov 2026). The site still has its side of it
    // (/api/draft-mode/enable and disable, click-to-edit in draft mode), so it can come back from git history if wanted.
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            ...singletons.filter((s) => !s.group).map((s) => S.listItem().title(s.title).id(s.id).child(S.document().schemaType(s.type).documentId(s.id))),
            // one folder for the legal pages: Privacy, Accessibility and the Company details
            S.listItem()
              .title("Legal")
              .id("legal")
              .child(
                S.list()
                  .title("Legal")
                  .items([
                    ...singletons.filter((s) => s.group === "legal").map((s) => S.listItem().title(s.title).id(s.id).child(S.document().schemaType(s.type).documentId(s.id))),
                  ]),
              ),
            // read only: the mailing list's numbers, written by the website (SubscriberNumbers.tsx)
            S.listItem()
              .title("Newsletter subscribers")
              .id("newsletter-subscribers")
              .child(S.component(SubscriberNumbers).id("newsletter-subscribers").title("Newsletter subscribers")),
            S.divider(),
            S.listItem()
              .title("Other")
              .id("other-pages")
              .child(
                S.documentList()
                  .title("Other")
                  .schemaType("page")
                  .filter('_type == "page" && !(_id in $fixed) && !(_id in $drafts)')
                  .params({ fixed: fixedIds, drafts: fixedIds.map((id) => `drafts.${id}`) })
                  .canHandleIntent((intent, params) => intent === "create" && params.template === "page"),
              ),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
    // new documents can only be pages (the others are the fixed ones above)
    templates: (templates) => templates.filter(({ schemaType }) => schemaType === "page"),
  },
  document: {
    actions: (input, { schemaType, documentId }) => {
      const kept =
        ["siteSettings", "menu", "legalPage", "companyDetails", "page", "newsletter"].includes(schemaType) && isFixed(documentId)
          ? input.filter(({ action }) => action && !["delete", "duplicate", "unpublish"].includes(action))
          : input;
      // Save first (the button), Cancel changes first in the ⋯ menu beside it
      const order = (a: DocumentActionComponent) => (a.action === "publish" ? 0 : a.action === "discardChanges" ? 1 : 2);
      return [...kept].sort((a, b) => order(a) - order(b)).map(rename);
    },
  },
  // no Releases or scheduled drafts: one version of each thing, saved or not
  releases: { enabled: false },
  scheduledDrafts: { enabled: false },
  studio: {
    components: {
      layout: (props: LayoutProps) => createElement(Fragment, null, createElement("style", null, hideVersionChips), props.renderDefault(props)),
    },
  },
});
