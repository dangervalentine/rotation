/**
 * Rotation design system — React components.
 * Guidelines for each live in design-system/components/<Name>.md; styles in ./components.css.
 */
import * as RAlert from "@radix-ui/react-alert-dialog";
import * as RCheckbox from "@radix-ui/react-checkbox";
import * as RDialog from "@radix-ui/react-dialog";
import * as RSelect from "@radix-ui/react-select";
import * as RToggleGroup from "@radix-ui/react-toggle-group";
import { forwardRef, useEffect, useId, useLayoutEffect, useRef, useSyncExternalStore, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type RefObject, type TextareaHTMLAttributes } from "react";

export type Category = "layer" | "shirt" | "undershirt" | "belt" | "pants" | "basics" | "shoes" | "other";
export type Slot = "layer" | "shirt" | "undershirt" | "belt" | "pants" | "shoes";
export interface Piece {
  slot: Slot;
  name: string | null;
  color: string | null;
  stripe?: string;
  /** Owned, to buy or a sketch. Only sketches are marked in a look. */
  status?: "owned" | "tobuy" | "sketch";
}

const SLOT_LABEL: Record<Category, string> = { layer: "Layer", shirt: "Shirt", undershirt: "Undershirt", belt: "Belt", pants: "Pants", basics: "Socks & underwear", shoes: "Shoes", other: "Other" };
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const pad2 = (n: number) => String(n).padStart(2, "0");

/* ---------- Kicker ---------- */

export function Kicker({ tone = "muted", className, children }: { tone?: "muted" | "ink" | "accent"; className?: string; children?: ReactNode }) {
  return <span className={cx("rt-kicker", tone !== "muted" && "rt-kicker-" + tone, className)}>{children}</span>;
}

/* ---------- Button ---------- */

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
}

export function Button({ variant = "secondary", size = "md", className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} {...rest} className={cx("rt-btn", variant !== "secondary" && "rt-btn-" + variant, size === "sm" && "rt-btn-sm", className)} />;
}

/* ---------- Tag ---------- */

export function Tag({ tone = "neutral", className, children }: { tone?: "neutral" | "owned" | "tobuy" | "flag" | "accent" | "sketch"; className?: string; children: ReactNode }) {
  return <span className={cx("rt-tag", tone !== "neutral" && "rt-tag-" + tone, className)}>{children}</span>;
}

/* ---------- Swatch ---------- */

export function swatchBackground(color: string, stripe?: string, band = 3) {
  return stripe ? `repeating-linear-gradient(90deg,${color} 0 ${band}px,${stripe} ${band}px ${band + 2}px)` : color;
}

export function Swatch({ color, stripe, size = "sm", label, className }: { color: string | null | undefined; stripe?: string; size?: "sm" | "lg"; label?: string; className?: string }) {
  return (
    <span
      className={cx("rt-sw", size === "lg" && "rt-sw-lg", !color && "rt-sw-none", className)}
      style={color ? { background: swatchBackground(color, stripe) } : undefined}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

/* ---------- Tabs ---------- */

export interface TabItem {
  id: string;
  label: string;
  /** When set, the tab is a link (use for hash or route navigation). */
  href?: string;
  /** A step colour (1–4): the tab number gets a chip of that colour. */
  step?: 1 | 2 | 3 | 4;
}

export function Tabs({ items, value, onChange, numbered = true, label = "Sections", className }: { items: TabItem[]; value: string; onChange?: (id: string) => void; numbered?: boolean; label?: string; className?: string }) {
  const body = (it: TabItem, i: number) => (
    <>
      {numbered ? <span className="rt-tab-n">{pad2(i + 1)}</span> : null}
      {it.label}
    </>
  );
  const navRef = useRef<HTMLElement>(null);
  // On narrow screens the strip scrolls sideways: keep the current tab in view (without moving the page).
  useEffect(() => {
    const nav = navRef.current;
    const cur = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !cur) return;
    if (cur.offsetLeft < nav.scrollLeft || cur.offsetLeft + cur.offsetWidth > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = cur.offsetLeft - 16;
  }, [value]);
  if (items.some((it) => it.href)) {
    return (
      <nav ref={navRef} className={cx("rt-tabs", className)} aria-label={label}>
        {items.map((it, i) => (
          <a key={it.id} href={it.href} className={cx("rt-tab", it.step && "rt-step-" + it.step)} data-step={it.step} aria-current={it.id === value ? "page" : undefined} onClick={() => onChange?.(it.id)}>
            {body(it, i)}
          </a>
        ))}
      </nav>
    );
  }
  return (
    <div className={cx("rt-tabs", className)} role="tablist" aria-label={label}>
      {items.map((it, i) => (
        <button key={it.id} type="button" role="tab" className="rt-tab" aria-selected={it.id === value} onClick={() => onChange?.(it.id)}>
          {body(it, i)}
        </button>
      ))}
    </div>
  );
}

/* ---------- Masthead ---------- */

export function Masthead({ title, section = "The Wardrobe", meta, tools, dek, children, className }: { title: ReactNode; section?: ReactNode; meta?: ReactNode; /** Small controls at the end of the top line (e.g. the theme switch). */ tools?: ReactNode; dek?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <header className={cx("rt-mast", className)}>
      <div className="rt-mast-top">
        <Kicker tone="ink">{section}</Kicker>
        <span className="rt-mast-end">
          {meta ? <span className="rt-mast-meta">{meta}</span> : null}
          {tools}
        </span>
      </div>
      {children ? <div className="rt-mast-nav">{children}</div> : null}
      {typeof title === "string" ? <h1 className="rt-mast-title">{title}</h1> : <div className="rt-mast-title">{title}</div>}
      {dek ? <p className="rt-mast-dek">{dek}</p> : null}
      <div className="rt-mast-rule" aria-hidden="true" />
    </header>
  );
}

/* ---------- Section head (view and panel titles) ---------- */

export function SectionHead({ kicker, title, id, aside, level = 2, number, className }: { kicker?: ReactNode; title: ReactNode; id?: string; aside?: ReactNode; level?: 2 | 3; /** The view's step number, shown as a numeral block in the step colour. Once per view. */ number?: number; className?: string }) {
  const H = level === 2 ? "h2" : "h3";
  const titles = (
    <div className="rt-shead-titles">
      {kicker ? <Kicker>{kicker}</Kicker> : null}
      <H id={id} className={level === 2 ? "rt-shead-title" : "rt-shead-title rt-shead-title-sm"}>{title}</H>
    </div>
  );
  return (
    <div className={cx("rt-shead", className)}>
      {number ? (
        <div className="rt-shead-lead">
          <div className="rt-shead-num" aria-hidden="true"><span>{pad2(number)}</span></div>
          {titles}
        </div>
      ) : titles}
      {aside ? <div className="rt-shead-aside">{aside}</div> : null}
    </div>
  );
}

/* ---------- Stat ---------- */

export function Stat({ value, label, note, className }: { value: ReactNode; label: ReactNode; note?: ReactNode; className?: string }) {
  return (
    <div className={cx("rt-stat", className)}>
      <span className="rt-stat-v">{value}</span>
      <Kicker className="rt-stat-l">{label}</Kicker>
      {note ? <span className="rt-stat-n">{note}</span> : null}
    </div>
  );
}

/* ---------- GarmentCard ---------- */

export interface GarmentCardProps {
  category: Category;
  name: string;
  style?: string;
  brand?: string;
  color?: string;
  stripe?: string;
  image?: string;
  price: ReactNode;
  qty?: number;
  owned: boolean;
  /** Overrides `owned` for the tag: a sketch is neither owned nor on the shopping list. */
  status?: "owned" | "tobuy" | "sketch";
  worn?: number;
  onSelect?: () => void;
  className?: string;
}

export function GarmentCard(p: GarmentCardProps) {
  const inner = (
    <>
      <div className="rt-garment-plate" style={{ background: p.color ? swatchBackground(p.color, p.stripe, 10) : "var(--paper-sunk)" }}>
        {p.image ? <img src={p.image} alt="" referrerPolicy="no-referrer" /> : null}
        {(() => {
          const st = p.status ?? (p.owned ? "owned" : "tobuy");
          return <Tag tone={st}>{st === "owned" ? "Owned" : st === "sketch" ? "Sketch" : "To buy"}</Tag>;
        })()}
      </div>
      <div className="rt-garment-body">
        <Kicker>{SLOT_LABEL[p.category] + (p.style ? " · " + p.style : "")}</Kicker>
        <h3 className="rt-garment-name">{p.name}</h3>
        {p.brand ? <span className="rt-garment-brand">{p.brand}</span> : null}
        <div className="rt-garment-foot">
          <span className="rt-price">
            {p.price}
            {p.qty && p.qty > 1 ? " × " + p.qty : ""}
          </span>
          {typeof p.worn === "number" ? <span className="rt-spec">WORN {p.worn}D</span> : null}
        </div>
      </div>
    </>
  );
  return p.onSelect ? (
    <button type="button" className={cx("rt-garment", p.className)} onClick={p.onSelect}>
      {inner}
    </button>
  ) : (
    <article className={cx("rt-garment", p.className)}>{inner}</article>
  );
}

/* ---------- LookCard ---------- */

export interface LookCardProps {
  number: number;
  name?: ReactNode;
  kicker?: ReactNode;
  pieces: Piece[];
  flags?: string[];
  /** Optional illustration (the app's outfit figure), shown beside the piece list. */
  figure?: ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  /** Actions under the card (Edit, Duplicate, Delete). */
  children?: ReactNode;
  className?: string;
}

export function LookCard(p: LookCardProps) {
  const body = (
    <>
      <div className="rt-look-head">
        <Kicker tone={p.selected ? "accent" : "muted"}>{p.kicker ?? "Look"}</Kicker>
        <span className="rt-look-no">No. {pad2(p.number)}</span>
      </div>
      {p.name ? <div className="rt-look-name">{p.name}</div> : null}
      <div className="rt-look-strip" aria-hidden="true">
        {p.pieces.filter((x) => x.color).map((x) => (
          <span key={x.slot} style={{ background: x.color! }} />
        ))}
      </div>
      <div className={cx("rt-look-main", p.figure != null && "has-figure")}>
        {p.figure != null ? <div className="rt-look-figure">{p.figure}</div> : null}
        <ul className="rt-pieces">
          {p.pieces.map((pc) => (
            <li key={pc.slot} className="rt-piece">
              <Kicker>{SLOT_LABEL[pc.slot]}</Kicker>
              <Swatch color={pc.color} stripe={pc.stripe} />
              {pc.name ? <span>{pc.name}</span> : <span className="rt-piece-empty">None</span>}
              {pc.status === "sketch" ? <Tag tone="sketch">Sketch</Tag> : null}
            </li>
          ))}
        </ul>
      </div>
      {p.flags?.length ? (
        <div className="rt-look-flags">
          {p.flags.map((f) => (
            <Tag key={f} tone="flag">{f}</Tag>
          ))}
        </div>
      ) : null}
    </>
  );
  return (
    <article className={cx("rt-look", p.selected && "is-selected", p.className)}>
      {p.onSelect ? (
        <button type="button" className="rt-look-hit" aria-pressed={!!p.selected} onClick={p.onSelect}>
          {body}
        </button>
      ) : (
        body
      )}
      {p.children ? <div className="rt-look-actions">{p.children}</div> : null}
    </article>
  );
}

/* ---------- RotationDay ---------- */

export interface RotationDayProps {
  day: string;
  week?: number;
  pieces: Piece[];
  figure?: ReactNode;
  selected?: boolean;
  /** Set when selecting the day opens an editing panel: true while that panel shows this day. */
  expanded?: boolean;
  edited?: boolean;
  flags?: string[];
  onClick?: () => void;
  className?: string;
}

export const RotationDay = forwardRef<HTMLButtonElement, RotationDayProps>(function RotationDay(p, ref) {
  // With `expanded` the day opens an editing panel, so it is a disclosure (aria-expanded) rather than a toggle.
  const state = p.expanded === undefined ? { "aria-pressed": !!p.selected } : { "aria-haspopup": "dialog" as const, "aria-expanded": p.expanded };
  return (
    <button ref={ref} type="button" className={cx("rt-day", p.figure != null && "has-figure", p.selected && "is-selected", p.className)} {...state} onClick={p.onClick}>
      {p.figure != null ? <span className="rt-day-figure">{p.figure}</span> : null}
      <span className="rt-day-body">
        <span className="rt-day-head">
          <span className="rt-day-name">{p.day}</span>
          {p.week ? <span className="rt-spec">WK {pad2(p.week)}</span> : null}
        </span>
        <span className="rt-day-strip" aria-hidden="true">
          {p.pieces.map((x) => (
            <Swatch key={x.slot} color={x.color} stripe={x.stripe} />
          ))}
        </span>
        <span className="rt-day-list">
          {p.pieces.filter((x) => x.name).map((x) => (
            <span key={x.slot}>{x.name}</span>
          ))}
        </span>
        {p.edited ? <span className="rt-day-edited">Edited, not applied</span> : null}
        {p.flags?.map((f) => (
          <Tag key={f} tone="flag">{f}</Tag>
        ))}
      </span>
    </button>
  );
});

/* ---------- Field ---------- */

interface FieldBase {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Extra control beside the label (e.g. a "keep" checkbox). */
  extra?: ReactNode;
  className?: string;
}

function FieldShell({ id, label, hint, error, extra, className, children }: FieldBase & { id: string; children: ReactNode }) {
  return (
    <div className={cx("rt-field", error != null && error !== "" && "rt-field-error", className)}>
      <div className="rt-field-head">
        <label className="rt-field-label" htmlFor={id}>{label}</label>
        {extra}
      </div>
      {children}
      {error || hint ? <span className="rt-field-hint" id={id + "-h"}>{error || hint}</span> : null}
    </div>
  );
}

export function Field({ label, hint, error, extra, className, id, ...rest }: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const fid = id || auto;
  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} extra={extra} className={className}>
      <input type="text" {...rest} id={fid} className={cx("rt-input", rest.type === "color" && "rt-input-color")} aria-invalid={error ? true : undefined} aria-describedby={hint || error ? fid + "-h" : undefined} />
    </FieldShell>
  );
}

export function TextArea({ label, hint, error, extra, className, id, ...rest }: FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const fid = id || auto;
  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} extra={extra} className={className}>
      <textarea {...rest} id={fid} className="rt-input rt-textarea" aria-describedby={hint || error ? fid + "-h" : undefined} />
    </FieldShell>
  );
}

/* ---------- Select (Radix, styled as a Field) ---------- */

export interface SelectOption {
  value: string;
  label: string;
  /** Show a swatch before the label; null draws the empty-slot ring. */
  swatch?: { color: string; stripe?: string } | null;
  /** A status shown in the menu row (not in the trigger). */
  tag?: { label: string; tone: "owned" | "tobuy" | "sketch" };
  /** An action ("Create a piece…"): listed after a separator, calls onAction, never becomes the value. */
  action?: true;
}

export function Select({ id, label, value, onChange, options, extra, hint, className, onHighlight, onAction }: FieldBase & {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  /** The option under the pointer or keyboard focus (null for actions, and when the menu closes). For previews. */
  onHighlight?: (value: string | null) => void;
  onAction?: (value: string) => void;
}) {
  const values = options.filter((o) => !o.action);
  const actions = options.filter((o) => o.action);
  const item = (o: SelectOption) => (
    <RSelect.Item key={o.value} value={o.value} className={cx("rt-select-item", o.action && "rt-select-action")} onFocus={() => onHighlight?.(o.action ? null : o.value)}>
      <RSelect.ItemText>
        <span className="rt-select-row">
          {o.swatch !== undefined ? <Swatch color={o.swatch?.color} stripe={o.swatch?.stripe} /> : null}
          {o.label}
        </span>
      </RSelect.ItemText>
      {o.tag ? <Tag tone={o.tag.tone} className="rt-select-tag">{o.tag.label}</Tag> : null}
      <RSelect.ItemIndicator className="rt-select-check">●</RSelect.ItemIndicator>
    </RSelect.Item>
  );
  return (
    <FieldShell id={id} label={label} hint={hint} extra={extra} className={className}>
      <RSelect.Root
        value={value}
        onValueChange={(v) => (actions.some((a) => a.value === v) ? onAction?.(v) : onChange(v))}
        onOpenChange={(o) => { if (!o) onHighlight?.(null); }}
      >
        <RSelect.Trigger id={id} className="rt-input rt-select-trigger">
          <RSelect.Value />
          <RSelect.Icon className="rt-select-icon" aria-hidden="true">
            <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" /></svg>
          </RSelect.Icon>
        </RSelect.Trigger>
        <RSelect.Portal>
          <RSelect.Content className="rt-select-menu" position="popper" sideOffset={4}>
            <RSelect.Viewport>
              {values.map(item)}
              {actions.length ? <RSelect.Separator className="rt-select-sep" /> : null}
              {actions.map(item)}
            </RSelect.Viewport>
          </RSelect.Content>
        </RSelect.Portal>
      </RSelect.Root>
    </FieldShell>
  );
}

/* ---------- Check (checkbox with a label) ---------- */

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  /** Required when there is no visible label (e.g. a table cell). */
  "aria-label"?: string;
}

/** The bare box. Prefer `Check`, which adds a visible label. */
export function Checkbox({ checked, onCheckedChange, ...rest }: CheckboxProps) {
  return (
    <RCheckbox.Root {...rest} className="rt-checkbox" checked={checked} onCheckedChange={(v) => onCheckedChange(v === true)}>
      <RCheckbox.Indicator className="rt-checkbox-mark" />
    </RCheckbox.Root>
  );
}

export function Check({ label, title, id, className, ...rest }: { label: ReactNode; title?: string; className?: string } & Omit<CheckboxProps, "aria-label">) {
  const auto = useId();
  const cid = id || auto;
  return (
    <span className={cx("rt-check", className)} title={title}>
      <Checkbox {...rest} id={cid} />
      <label htmlFor={cid}>{label}</label>
    </span>
  );
}

/* ---------- Segmented (pick one of a few) ---------- */

export function Segmented<T extends string>({ options, value, onChange, label }: { options: [T, string][]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    // Ignore deselection: one option is always chosen.
    <RToggleGroup.Root type="single" className="rt-seg" aria-label={label} value={value} onValueChange={(v) => { if (v) onChange(v as T); }}>
      {options.map(([v, l]) => (
        <RToggleGroup.Item key={v} value={v} className="rt-seg-item">
          {l}
        </RToggleGroup.Item>
      ))}
    </RToggleGroup.Root>
  );
}

/* ---------- Tiles (pick one, as pictures) ---------- */

export interface TileOption<T extends string> {
  value: T;
  /** Accessible name, and the caption under a picture tile. */
  label: string;
  /** The picture: a garment silhouette, a swatch. */
  content: ReactNode;
}

/** Pick one of several options shown as pictures: style tiles, a colour palette. Arrow keys move between them. */
export function Tiles<T extends string>({ label, options, value, onChange, variant = "tile", className }: { label: string; options: TileOption<T>[]; value: T | ""; onChange: (v: T) => void; variant?: "tile" | "swatch"; className?: string }) {
  return (
    <RToggleGroup.Root type="single" aria-label={label} className={cx("rt-tiles", "rt-tiles-" + variant, className)} value={value} onValueChange={(v) => { if (v) onChange(v as T); }}>
      {options.map((o) => (
        <RToggleGroup.Item key={o.value} value={o.value} className="rt-tile" aria-label={o.label} title={o.label}>
          <span className="rt-tile-art" aria-hidden="true">{o.content}</span>
          {variant === "tile" ? <span className="rt-tile-label" aria-hidden="true">{o.label}</span> : null}
        </RToggleGroup.Item>
      ))}
    </RToggleGroup.Root>
  );
}

/* ---------- Notice ---------- */

export function Notice({ tone = "warn", children }: { tone?: "warn" | "ok" | "neutral"; children: ReactNode }) {
  return (
    <p className={cx("rt-notice", "rt-notice-" + tone)} role="status">
      {children}
    </p>
  );
}

/* ---------- SaveBar ---------- */

export function SaveBar({ dirty, message, error, onSave, onDiscard, saveLabel = "Save", discardLabel = "Discard", className }: { dirty: boolean; message?: ReactNode; error?: boolean; onSave?: () => void; onDiscard?: () => void; saveLabel?: string; discardLabel?: string; className?: string }) {
  return (
    <div className={cx("rt-savebar", className)} role="region" aria-label="Save">
      <span className={cx("rt-savebar-status", error && "is-error")} role="status">
        {dirty ? <b>UNSAVED</b> : null}
        {message ?? (dirty ? "Kept as a draft until you save" : "All changes saved")}
      </span>
      <Button variant="ghost" size="sm" disabled={!dirty} onClick={onDiscard}>{discardLabel}</Button>
      <Button variant="primary" size="sm" disabled={!dirty} onClick={onSave}>{saveLabel}</Button>
    </div>
  );
}

/* ---------- Sheet (side panel on wide screens, bottom sheet on narrow ones) ---------- */

const WIDE = "(min-width: 1024px)";
function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => matchMedia(query).matches,
    () => true,
  );
}

export interface SheetProps {
  open: boolean;
  /** Called with false on Escape, the close button, or the backdrop (bottom sheet only). The consumer may refuse. */
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  kicker?: ReactNode;
  description?: ReactNode;
  /** Extra controls in the head, beside Close. */
  headActions?: ReactNode;
  /** Sticky action row. */
  footer?: ReactNode;
  /** Receives focus when the sheet closes (normally the item that opened it). */
  returnFocusRef?: RefObject<HTMLElement | null>;
  children?: ReactNode;
  className?: string;
}

export function Sheet(p: SheetProps) {
  const docked = useMedia(WIDE);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Docked, the page makes room so nothing sits under the panel (see html[data-sheet] in components.css).
  // A layout effect, so a page opened on a day (#rotation/day/3) lays out once instead of shifting.
  useLayoutEffect(() => {
    if (!(p.open && docked)) return;
    document.documentElement.dataset.sheet = "side";
    return () => { delete document.documentElement.dataset.sheet; };
  }, [p.open, docked]);

  // Docked, the calendar beside the panel stays usable: clicks and focus there must not close it.
  const keepOpen = (e: Event) => { if (docked) e.preventDefault(); };
  return (
    <RDialog.Root open={p.open} onOpenChange={p.onOpenChange} modal={!docked}>
      <RDialog.Portal>
        {docked ? null : <RDialog.Overlay className="rt-sheet-overlay" />}
        <RDialog.Content
          className={cx("rt-sheet", p.className)}
          data-mode={docked ? "side" : "bottom"}
          {...(p.description ? {} : { "aria-describedby": undefined })}
          onOpenAutoFocus={(e) => { e.preventDefault(); titleRef.current?.focus(); }}
          onCloseAutoFocus={(e) => { if (p.returnFocusRef?.current) { e.preventDefault(); p.returnFocusRef.current.focus(); } }}
          onInteractOutside={keepOpen}
          // A region marked data-escape-local (the piece creator) handles Escape itself, so the panel stays open.
          onEscapeKeyDown={(e) => { if ((e.target as Element | null)?.closest?.("[data-escape-local]")) e.preventDefault(); }}
        >
          <div className="rt-sheet-head">
            <div className="rt-sheet-titles">
              {p.kicker ? <Kicker tone="accent">{p.kicker}</Kicker> : null}
              <RDialog.Title ref={titleRef} tabIndex={-1} className="rt-sheet-title">{p.title}</RDialog.Title>
            </div>
            <div className="rt-sheet-tools">
              {p.headActions}
              <RDialog.Close asChild>
                <button type="button" className="rt-sheet-close" aria-label="Close">
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" /></svg>
                </button>
              </RDialog.Close>
            </div>
          </div>
          {p.description ? <RDialog.Description className="rt-sheet-desc">{p.description}</RDialog.Description> : null}
          <div className="rt-sheet-body">{p.children}</div>
          {p.footer ? <div className="rt-sheet-foot">{p.footer}</div> : null}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

/* ---------- ConfirmDialog ---------- */

export interface ConfirmAction {
  label: string;
  variant?: ButtonProps["variant"];
  onSelect: () => void;
}

/** A short question with two or three answers. The last action is the safe one (cancel). */
export function ConfirmDialog({ open, onOpenChange, title, description, actions, onCloseAutoFocus }: { open: boolean; onOpenChange: (open: boolean) => void; title: ReactNode; description: ReactNode; actions: ConfirmAction[]; /** Choose where focus goes when it closes (call preventDefault first). */ onCloseAutoFocus?: (e: Event) => void }) {
  const last = actions.length - 1;
  return (
    <RAlert.Root open={open} onOpenChange={onOpenChange}>
      <RAlert.Portal>
        <RAlert.Overlay className="rt-confirm-overlay" />
        <RAlert.Content className="rt-confirm" onCloseAutoFocus={onCloseAutoFocus}>
          <RAlert.Title className="rt-confirm-title">{title}</RAlert.Title>
          <RAlert.Description className="rt-confirm-desc">{description}</RAlert.Description>
          <div className="rt-confirm-actions">
            {actions.map((a, i) => {
              const W = i === last ? RAlert.Cancel : RAlert.Action;
              return (
                <W key={a.label} asChild>
                  <Button variant={a.variant} onClick={a.onSelect}>{a.label}</Button>
                </W>
              );
            })}
          </div>
        </RAlert.Content>
      </RAlert.Portal>
    </RAlert.Root>
  );
}
