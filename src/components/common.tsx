import { figureSvg, VIEWBOX } from "../lib/figure.ts";
import { findItem, shortName, SLOTS } from "../lib/model.ts";
import { itemStatus, STATUS_LABEL } from "../lib/sketch.ts";
import type { Figure, Item, Look } from "../lib/types.ts";
import { Swatch as DsSwatch, type Piece, type SelectOption } from "../design-system/index.ts";

export function OutfitFigure({ items, look, width, cartoon, figure }: { items: Item[]; look: Look; width?: number | string; cartoon?: boolean; figure?: Figure }) {
  const label = [look.layer, look.shirt, look.undershirt, look.pants, look.shoes]
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

/** Swatch for a wardrobe item (or the empty-slot ring for null). */
export function Swatch({ it }: { it: Item | null }) {
  return <DsSwatch color={it?.color} stripe={it?.stripe} />;
}

/** A look as design-system pieces, one per slot. */
export function lookPieces(items: Item[], look: Look): Piece[] {
  return SLOTS.map(([slot]) => {
    const it = findItem(items, look[slot]);
    return { slot, name: it ? shortName(it) : null, color: it?.color ?? null, stripe: it?.stripe, status: it ? itemStatus(it) : undefined };
  });
}

/** A select option for an item, with its swatch. */
export const itemOption = (it: Item): SelectOption => {
  const st = itemStatus(it);
  return { value: it.id, label: shortName(it), swatch: { color: it.color, stripe: it.stripe }, tag: { label: STATUS_LABEL[st], tone: st } };
};
