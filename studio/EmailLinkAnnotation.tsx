import type { ReactElement } from "react";

// How the "Email us" link looks while the club is editing: the words it covers are underlined in the studio's link colour, as a web link is.
// Without this the editor draws them as plain text (Sanity only styles its own link type), so it looks as if nothing was added.
type Props = { renderDefault: (props: never) => ReactElement };
export function EmailLinkAnnotation(props: Props) {
  return (
    <span style={{ color: "var(--card-link-fg-color)", textDecoration: "underline", textUnderlineOffset: "0.15em" }}>
      {props.renderDefault(props as never)}
    </span>
  );
}
