import * as RSelect from "@radix-ui/react-select";
import { figureSvg, VIEWBOX } from "../lib/figure.ts";
import { findItem } from "../lib/model.ts";
import type { Figure, Item, Look } from "../lib/types.ts";

export function OutfitFigure({ items, look, width, cartoon, figure }: { items: Item[]; look: Look; width?: number | string; cartoon?: boolean; figure?: Figure }) {
  const label = [look.layer, look.shirt, look.pants, look.shoes]
    .map((id) => findItem(items, id)?.name)
    .filter(Boolean)
    .join(", ");
  return (
    <svg
      viewBox={cartoon ? VIEWBOX.cartoon : VIEWBOX.plain}
      width={width || "100%"}
      role="img"
      aria-label={label || "Empty outfit"}
      dangerouslySetInnerHTML={{ __html: figureSvg(items, look, { cartoon, figure }) }}
    />
  );
}

export function Swatch({ it }: { it: Item | null }) {
  if (!it) return <span className="sw sw-none" aria-hidden="true" />;
  const bg = it.stripe ? `repeating-linear-gradient(90deg,${it.color} 0 4px,${it.stripe} 4px 6px)` : it.color;
  return <span className="sw" style={{ background: bg }} aria-hidden="true" />;
}

export interface SelectOption {
  value: string;
  label: string;
  swatch?: Item | null;
}

export function Select({ id, label, value, onChange, options, extra }: { id: string; label: string; value: string; onChange: (v: string) => void; options: SelectOption[]; extra?: React.ReactNode }) {
  return (
    <div className="field">
      <div className="field-head">
        <label htmlFor={id}>{label}</label>
        {extra}
      </div>
      <RSelect.Root value={value} onValueChange={onChange}>
        <RSelect.Trigger id={id} className="sel-trigger" aria-label={label}>
          <RSelect.Value />
          <RSelect.Icon className="sel-icon">▾</RSelect.Icon>
        </RSelect.Trigger>
        <RSelect.Portal>
          <RSelect.Content className="sel-content" position="popper" sideOffset={4}>
            <RSelect.Viewport className="sel-viewport">
              {options.map((o) => (
                <RSelect.Item key={o.value} value={o.value} className="sel-item">
                  <RSelect.ItemText>
                    <span className="sel-row">
                      {o.swatch !== undefined ? <Swatch it={o.swatch} /> : null}
                      {o.label}
                    </span>
                  </RSelect.ItemText>
                  <RSelect.ItemIndicator className="sel-check">✓</RSelect.ItemIndicator>
                </RSelect.Item>
              ))}
            </RSelect.Viewport>
          </RSelect.Content>
        </RSelect.Portal>
      </RSelect.Root>
    </div>
  );
}
