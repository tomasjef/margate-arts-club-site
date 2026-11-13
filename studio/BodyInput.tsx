import type { CSSProperties } from "react";
import { useFormValue, type ArrayOfObjectsInputProps } from "sanity";
import { limitFor, textLength } from "./textLimits";

// The Text field of a section, with a counter under it: how many characters, how many are allowed, and once it is too long by how many.
// The same count is checked again on Save (validation in schemaTypes/section.ts), so a text that is too long can't be saved.
export function BodyInput(props: ArrayOfObjectsInputProps) {
  const section = props.path.slice(0, -1);
  const list = useFormValue([...section, "listItems"]) as unknown[] | undefined;
  const hasList = Array.isArray(list) && list.length > 0;
  const max = limitFor(hasList);
  const n = textLength(props.value);
  const over = n - max;
  const near = over <= 0 && n >= max * 0.9;
  const style: CSSProperties = {
    marginTop: 8,
    fontSize: 14,
    lineHeight: "20px",
    fontVariantNumeric: "tabular-nums",
    color: over > 0 ? "#b3261e" : near ? "#8a5a00" : "#5c6270",
    fontWeight: over > 0 ? 600 : 400,
  };
  return (
    <div>
      {props.renderDefault(props)}
      <div style={style} role="status">
        {over > 0
          ? `${n} of ${max} characters: ${over} too many. Please shorten the text so it fits the square box on the page.`
          : `${n} of ${max} characters${hasList ? " (with a list under the text)" : ""}`}
      </div>
    </div>
  );
}
