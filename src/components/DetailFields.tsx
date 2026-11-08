import { Field, Kicker, Segmented, Swatch, Tiles } from "../design-system/index.ts";
import { luminance } from "../lib/colour.ts";
import { pieceSvg } from "../lib/figure.ts";
import { BUCKLES, detailOptions, detailsOf, HARDWARE, HARDWARE_HEX, LENGTHS, PATTERNS, SLEEVES, styleSpec, type DetailKey } from "../lib/styles.ts";
import type { Category, Item, Pattern, Slot } from "../lib/types.ts";

export type DetailValue = Partial<Pick<Item, DetailKey | "stripe">>;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const LABEL: Record<string, string> = { breton: "Breton stripe", check: "Check", "d-ring": "D-ring", rolled: "Rolled", cropped: "Cropped" };
const label = (v: string) => LABEL[v] ?? cap(v);
const TITLE: Record<DetailKey, string> = { sleeve: "Sleeve", pattern: "Pattern", hardware: "Hardware", length: "Length", buckle: "Buckle" };
const VALUES: Record<Exclude<DetailKey, "pattern" | "hardware">, readonly string[]> = { sleeve: SLEEVES, length: LENGTHS, buckle: BUCKLES };
/** A second colour that shows against the garment: navy on light cloth, off-white on dark. */
const contrasting = (color: string) => (luminance(color) > 0.6 ? "#22304a" : "#f4f3ef");

/**
 * The options a style can be customised with: sleeve, pattern (with a second colour), hardware, length, buckle.
 * Only the ones the style uses are shown. "tiles" draws each choice on the garment; "compact" uses text controls.
 */
export function DetailFields({ cat, style, value, onChange, variant, color, idPrefix }: {
  cat: Category;
  style: string;
  value: DetailValue;
  onChange: (patch: DetailValue) => void;
  variant: "tiles" | "compact";
  /** The garment's main colour, for live tile art and pattern swatches. */
  color: string;
  idPrefix: string;
}) {
  const keys = detailOptions(cat, style);
  if (!keys.length) return null;
  const eff = detailsOf({ cat, style, stripe: value.stripe, ...value });
  const second = value.stripe || contrasting(color);
  const art = styleSpec(cat, style).art;

  /** One choice drawn on the garment itself. */
  const pieceArt = (patch: DetailValue) => {
    if (!art || art === "acc") return null;
    const it: Item = { id: "__detail", cat, name: style, style, color, price: 0, qty: 1, owned: false, ...value, ...patch };
    const { svg, viewBox } = pieceSvg(it, art as Slot);
    return <svg viewBox={viewBox} dangerouslySetInnerHTML={{ __html: svg }} />;
  };

  return (
    <div className={"rt-details rt-details-" + variant}>
      {keys.map((k) => {
        const id = `${idPrefix}-${k}`;
        if (k === "pattern") {
          const current = eff.pattern;
          const choose = (pattern: Pattern) => onChange(pattern === "solid" ? { pattern: "solid" } : { pattern, stripe: second });
          return (
            <div key={k} className="rt-detail" id={id}>
              <div className="rt-detail-head">
                <Kicker>{TITLE[k]}</Kicker>
                <span className="rt-detail-value">{label(current)}</span>
              </div>
              <Tiles
                label={TITLE[k]}
                variant="swatch"
                value={current}
                onChange={(v) => choose(v as Pattern)}
                options={PATTERNS.map((pt) => ({ value: pt, label: label(pt), content: <Swatch color={color} stripe={pt === "solid" ? undefined : second} pattern={pt} /> }))}
              />
              {current !== "solid" ? (
                <Field id={id + "-second"} type="color" label="Second colour" value={second} onChange={(e) => onChange({ pattern: current, stripe: e.target.value })} />
              ) : null}
            </div>
          );
        }
        if (k === "hardware") {
          const current = eff.hardware!;
          return (
            <div key={k} className="rt-detail" id={id}>
              <div className="rt-detail-head">
                <Kicker>{TITLE[k]}</Kicker>
                <span className="rt-detail-value">{label(current)}</span>
              </div>
              <Tiles
                label={TITLE[k]}
                variant="swatch"
                value={current}
                onChange={(v) => onChange({ hardware: v })}
                options={HARDWARE.map((h) => ({ value: h, label: label(h), content: <Swatch color={HARDWARE_HEX[h]} /> }))}
              />
            </div>
          );
        }
        const values = VALUES[k];
        const current = eff[k] as string;
        if (variant === "compact") {
          return (
            <div key={k} className="rt-field rt-detail" id={id}>
              <span className="rt-field-label">{TITLE[k]}</span>
              <Segmented label={TITLE[k]} options={values.map((v) => [v, label(v)] as [string, string])} value={current} onChange={(v) => onChange({ [k]: v })} />
            </div>
          );
        }
        return (
          <div key={k} className="rt-detail" id={id}>
            <Kicker>{TITLE[k]}</Kicker>
            <Tiles label={TITLE[k]} value={current} onChange={(v) => onChange({ [k]: v })} options={values.map((v) => ({ value: v, label: label(v), content: pieceArt({ [k]: v }) }))} />
          </div>
        );
      })}
    </div>
  );
}
