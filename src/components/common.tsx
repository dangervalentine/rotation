import type { ReactNode } from "react";
import { basicsIconSvg, figureSvg, pieceSvg, VIEWBOX } from "../lib/figure.ts";
import { findItem, shortName, SLOTS } from "../lib/model.ts";
import { itemStatus, STATUS_LABEL } from "../lib/sketch.ts";
import { detailsOf, styleSpec } from "../lib/styles.ts";
import type { Figure, Item, Look, Slot } from "../lib/types.ts";
import { VIEW_ORDER, type ViewId } from "../lib/route.ts";
import { SectionHead, Swatch as DsSwatch, type Piece, type SelectOption } from "../design-system/index.ts";

/** The dek says what each step is for. */
const DEKS: Record<ViewId, string> = {
  wardrobe: "Everything you own or mean to buy.",
  outfits: "Put pieces together into looks, and keep the ones you like.",
  rotation: "Plan what to wear each day, for as many days and weeks as you like.",
  print: "Your plan on paper, to pin up by the closet.",
};

/** The head of every view: its step numeral, the app's name as the page's h1, and the step's dek. */
export function PageHead({ view, aside }: { view: ViewId; aside?: ReactNode }) {
  return <SectionHead level={1} number={VIEW_ORDER.indexOf(view) + 1} title="Rotation" dek={DEKS[view]} aside={aside} />;
}

export function OutfitFigure({ items, look, width, cartoon, figure }: { items: Item[]; look: Look; width?: number | string; cartoon?: boolean; figure?: Figure }) {
  const label = [look.layer, look.shirt, look.undershirt, look.pants, look.shoes, ...(look.acc ?? [])]
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

/**
 * A small drawing for items the figure can't show in a slot: socks and underwear (icons) and accessories.
 * Null for everything else.
 */
export function ItemArt({ it, className }: { it: Item; className?: string }) {
  let art: { svg: string; viewBox: string } | null = null;
  if (it.cat === "basics") art = { svg: basicsIconSvg(it), viewBox: "0 0 24 24" };
  else if (it.cat === "other" && styleSpec(it.cat, it.style).art) art = pieceSvg(it, "acc");
  if (!art) return null;
  return <svg className={className} viewBox={art.viewBox} role="img" aria-label={it.style} dangerouslySetInnerHTML={{ __html: art.svg }} />;
}

/** A garment drawn on its own, as it looks on the figure, labelled with the slot it fills. Null if it isn't drawn in that slot. */
export function PieceIcon({ it, slot, className }: { it: Item; slot: Slot; className?: string }) {
  if (it.cat !== slot) return null;
  const { svg, viewBox } = pieceSvg(it, slot);
  if (!svg) return null;
  const label = SLOTS.find(([s]) => s === slot)![1];
  return <svg className={className} viewBox={viewBox} role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** Swatch for a wardrobe item (or the empty-slot ring for null). */
export function Swatch({ it }: { it: Item | null }) {
  return <DsSwatch color={it?.color} stripe={it?.stripe} pattern={it ? detailsOf(it).pattern : undefined} />;
}

/** A look as design-system pieces: one per slot, then one per accessory. */
export function lookPieces(items: Item[], look: Look): Piece[] {
  const piece = (slot: Piece["slot"], it: Item | null, id?: string): Piece =>
    ({ slot, id, name: it ? shortName(it) : null, color: it?.color ?? null, stripe: it?.stripe, pattern: it ? detailsOf(it).pattern : undefined, status: it ? itemStatus(it) : undefined });
  const acc = (look.acc ?? []).map((id) => findItem(items, id)).filter((it): it is Item => !!it);
  return [...SLOTS.map(([slot]) => piece(slot, findItem(items, look[slot]))), ...acc.map((it) => piece("acc", it, it.id))];
}

/** A select option for an item, with its swatch. */
export const itemOption = (it: Item): SelectOption => {
  const st = itemStatus(it);
  return { value: it.id, label: shortName(it), swatch: { color: it.color, stripe: it.stripe, pattern: detailsOf(it).pattern }, tag: { label: STATUS_LABEL[st], tone: st } };
};
