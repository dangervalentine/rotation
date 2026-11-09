/**
 * Rotation design system — React components.
 * Guidelines for each live in design-system/components/<Name>.md; styles in ./components.css.
 */
import * as RAlert from "@radix-ui/react-alert-dialog";
import * as RCheckbox from "@radix-ui/react-checkbox";
import * as RDialog from "@radix-ui/react-dialog";
import * as RSelect from "@radix-ui/react-select";
import * as RToggleGroup from "@radix-ui/react-toggle-group";
import { createContext, forwardRef, useContext, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type RefObject, type TextareaHTMLAttributes } from "react";
import { createPortal } from "react-dom";

export type Category = "layer" | "shirt" | "undershirt" | "belt" | "pants" | "basics" | "shoes" | "other";
export type Slot = "layer" | "shirt" | "undershirt" | "belt" | "pants" | "shoes";
export interface Piece {
    /** An outfit slot, or "acc" for one of the look's accessories. */
    slot: Slot | "acc";
    /** Tells several accessories apart (React keys). */
    id?: string;
    name: string | null;
    color: string | null;
    stripe?: string;
    pattern?: SwatchPattern;
    /** Owned, to buy or a sketch. Only sketches are marked in a look. */
    status?: "owned" | "tobuy" | "sketch";
    /** Link to the item's detail page. LookCard links the name unless the whole card is a button. */
    href?: string;
}

const SLOT_LABEL: Record<Category | "acc", string> = { layer: "Layer", shirt: "Shirt", undershirt: "Undershirt", belt: "Belt", pants: "Pants", basics: "Socks & underwear", shoes: "Shoes", other: "Accessories", acc: "Accessory" };
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const pad2 = (n: number) => String(n).padStart(2, "0");

/** True when motion should be skipped: the device asks for less, or the person turned animation off (`data-motion="reduce"` on <html>). */
export function motionReduced() {
    if (typeof document === "undefined") return false;
    return document.documentElement.dataset.motion === "reduce" || (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
}

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

/** A garment's pattern as a swatch shows it. "stripe" is the default whenever a second colour is set. */
export type SwatchPattern = "solid" | "stripe" | "pinstripe" | "breton" | "gingham" | "check" | "dot";

/** CSS background for a garment colour with its pattern (`stripe` is the pattern's second colour). */
export function swatchBackground(color: string, stripe?: string, band = 3, pattern: SwatchPattern = "stripe") {
    if (!stripe || pattern === "solid") return color;
    const tile = (g: string, size: number) => `${g} 0 0 / ${size}px ${size}px`;
    switch (pattern) {
        case "pinstripe":
            return `repeating-linear-gradient(90deg,${color} 0 ${band * 1.5}px,${stripe} ${band * 1.5}px ${band * 1.5 + 1}px)`;
        case "breton":
            return `repeating-linear-gradient(0deg,${color} 0 ${band}px,${stripe} ${band}px ${band + 2}px)`;
        case "gingham":
            return [tile(`linear-gradient(90deg,${stripe}80 50%,transparent 50%)`, band * 2), tile(`linear-gradient(0deg,${stripe}80 50%,transparent 50%)`, band * 2), color].join(",");
        case "check":
            return [tile(`linear-gradient(90deg,${stripe}a6 30%,transparent 30%)`, band * 3), tile(`linear-gradient(0deg,${stripe}a6 30%,transparent 30%)`, band * 3), color].join(",");
        case "dot":
            return [tile(`radial-gradient(${stripe} 28%,transparent 32%)`, band * 2), color].join(",");
        default:
            return `repeating-linear-gradient(90deg,${color} 0 ${band}px,${stripe} ${band}px ${band + 2}px)`;
    }
}

export function Swatch({ color, stripe, pattern, size = "sm", label, className }: { color: string | null | undefined; stripe?: string; pattern?: SwatchPattern; size?: "sm" | "lg"; label?: string; className?: string }) {
    return (
        <span
            className={cx("rt-sw", size === "lg" && "rt-sw-lg", !color && "rt-sw-none", className)}
            style={color ? { background: swatchBackground(color, stripe, 3, pattern) } : undefined}
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

/**
 * The nav bar renders beside the header, not inside it, so it can stay stuck to the top
 * of the page after the title scrolls away.
 */
export function Masthead({ brand, title, meta, tools, dek, children, className }: { /** The app's wordmark, at the start of the bar (normally a `Wordmark`). */ brand?: ReactNode; /** Omit to render the bar alone, when the page has its own head (`StepHead`). */ title?: ReactNode; /** A short status line in the bar, before the tools (e.g. a save error). */ meta?: ReactNode; /** Small controls at the end of the nav bar (e.g. the theme switch). */ tools?: ReactNode; dek?: ReactNode; children?: ReactNode; className?: string }) {
    return (
        <>
            {brand || children || tools ? (
                // The bar is the page's banner when the masthead has no title header of its own.
                <div className={cx("rt-mast-bar", className)} role={title ? undefined : "banner"}>
                    {brand ? <div className="rt-mast-brand">{brand}</div> : null}
                    <div className="rt-mast-nav">{children}</div>
                    {meta || tools ? (
                        <span className="rt-mast-end">
                            {meta ? <span className="rt-mast-meta">{meta}</span> : null}
                            {tools}
                        </span>
                    ) : null}
                </div>
            ) : null}
            {title ? (
                <header className={cx("rt-mast", className)}>
                    {typeof title === "string" ? <h1 className="rt-mast-title">{title}</h1> : <div className="rt-mast-title">{title}</div>}
                    {dek ? <p className="rt-mast-dek">{dek}</p> : null}
                    <div className="rt-mast-rule" aria-hidden="true" />
                </header>
            ) : null}
        </>
    );
}

/** The app's wordmark: its mark (the favicon's square, with the name's first letter) and its name. On phones only the mark shows; the name is still read out. */
export function Wordmark({ name, href }: { name: string; href: string }) {
    return (
        <a className="rt-brand" href={href}>
            <span className="rt-brand-mark" aria-hidden="true">{name[0]}</span>
            <span className="rt-brand-name">{name}</span>
        </a>
    );
}

/* ---------- Settings (gear button and panel) ---------- */

/** The gear: a 16px line icon, as the README's iconography asks (1.5px stroke, square caps, ink). */
function GearIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true">
            <circle cx="8" cy="8" r="4.5" strokeWidth="1.5" />
            <circle cx="8" cy="8" r="1.75" strokeWidth="1.5" />
            <path d="M8 .75v2.5M8 12.75v2.5M.75 8h2.5M12.75 8h2.5M2.87 2.87l1.77 1.77M11.36 11.36l1.77 1.77M2.87 13.13l1.77-1.77M11.36 4.64l1.77-1.77" strokeWidth="2" strokeLinecap="square" />
        </svg>
    );
}

/** A gear button that opens a small settings panel under it. Click outside or Escape closes it. Put `Setting` rows inside. */
export function Settings({ label = "Settings", children }: { label?: string; children: ReactNode }) {
    const id = useId();
    const button = useRef<HTMLButtonElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const p = panel.current;
        if (!p) return;
        // Under the gear, its right edge on the gear's (the CSS shifts it back by its own width). The bar is sticky,
        // so the gear doesn't move while the panel is open.
        const place = () => {
            const b = button.current!.getBoundingClientRect();
            p.style.top = `${Math.round(b.bottom + 8)}px`;
            p.style.left = `${Math.round(b.right)}px`;
        };
        const onBefore = (e: Event) => { if ((e as ToggleEvent).newState === "open") place(); };
        const onToggle = (e: Event) => setOpen((e as ToggleEvent).newState === "open");
        p.addEventListener("beforetoggle", onBefore);
        p.addEventListener("toggle", onToggle);
        window.addEventListener("resize", place);
        return () => {
            p.removeEventListener("beforetoggle", onBefore);
            p.removeEventListener("toggle", onToggle);
            window.removeEventListener("resize", place);
        };
    }, []);
    return (
        <>
            <button ref={button} type="button" className="rt-icon-btn" popoverTarget={id} aria-label={label} aria-expanded={open} title={label}>
                <GearIcon />
            </button>
            <div ref={panel} id={id} popover="auto" className="rt-popover" role="dialog" aria-label={label}>
                <p className="rt-popover-title" aria-hidden="true">{label}</p>
                {children}
            </div>
        </>
    );
}

/** One row in `Settings`: a kicker label over its control, with an optional note under it. */
export function Setting({ label, note, children }: { label: string; note?: ReactNode; children: ReactNode }) {
    return (
        <div className="rt-setting">
            <Kicker>{label}</Kicker>
            {children}
            {note ? <p className="rt-setting-note">{note}</p> : null}
        </div>
    );
}

/* ---------- Section head (view and panel titles) ---------- */

const SHEAD_TITLE = { 1: "rt-shead-title rt-shead-title-lg", 2: "rt-shead-title", 3: "rt-shead-title rt-shead-title-sm" };

/** `level={1}` is a view's page head: the `h1` at masthead size, with an italic `dek` under it. */
export function SectionHead({ kicker, title, dek, id, aside, level = 2, number, className }: { kicker?: ReactNode; title: ReactNode; dek?: ReactNode; id?: string; aside?: ReactNode; level?: 1 | 2 | 3; /** The view's step number, shown as a numeral block in the step colour. Once per view. */ number?: number; className?: string }) {
    const H = (["h1", "h2", "h3"] as const)[level - 1];
    const titles = (
        <div className="rt-shead-titles">
            {kicker ? <Kicker>{kicker}</Kicker> : null}
            <H id={id} className={SHEAD_TITLE[level]}>{title}</H>
            {dek ? <p className="rt-shead-dek">{dek}</p> : null}
        </div>
    );
    const Box = level === 1 ? "header" : "div";
    return (
        <Box className={cx("rt-shead", level === 1 && "rt-shead-page", className)}>
            {number ? (
                <div className="rt-shead-lead">
                    <div className="rt-shead-num" aria-hidden="true"><span>{pad2(number)}</span></div>
                    {titles}
                </div>
            ) : titles}
            {aside ? <div className="rt-shead-aside">{aside}</div> : null}
        </Box>
    );
}

/* ---------- Step head (the page head shared by every step) ---------- */

export type StepDir = "forward" | "back";
type RollLayer = { key: number; value: string; role: "in" | "out" };

/** Text that rolls to a new value: the old one leaves and the new one arrives, up for `forward` and down for `back`. The first value doesn't animate. */
export function RollText({ value, dir, className }: { value: string; dir: StepDir; className?: string }) {
    const [roll, setRoll] = useState<{ value: string; animate: boolean; layers: RollLayer[] }>(() => ({ value, animate: false, layers: [{ key: 0, value, role: "in" }] }));
    if (roll.value !== value) {
        // Only the latest value leaves, so a quick run of changes never stacks up. Under reduced motion nothing animates, so nothing is left to remove.
        const last = roll.layers[roll.layers.length - 1];
        const still = motionReduced();
        const arriving: RollLayer = { key: last.key + 1, value, role: "in" };
        setRoll({ value, animate: !still, layers: still ? [arriving] : [{ ...last, role: "out" }, arriving] });
    }
    const settle = () => setRoll((r) => ({ ...r, layers: r.layers.filter((l) => l.role === "in") }));
    return (
        <span className={cx("rt-roll", className)} data-dir={dir}>
            {roll.layers.map((l) => (
                <span
                    key={l.key}
                    className={cx("rt-roll-l", roll.animate && "rt-roll-" + l.role)}
                    aria-hidden={l.role === "out" || undefined}
                    onAnimationEnd={l.role === "in" ? settle : undefined}
                >
                    {l.value}
                </span>
            ))}
        </span>
    );
}

const StepAsideSlot = createContext<HTMLElement | null>(null);

/** The one page head above every step: the step numeral on its colour, the step's name as the page's h1, and its dek.
 *  It stays mounted from step to step, so each part rolls (and the colour blends) to the new step. `children` is the page below it. */
export function StepHead({ number, title, dek, dir, className, children }: { number: 1 | 2 | 3 | 4; title: string; dek: string; /** Direction of the latest step change. */ dir: StepDir; className?: string; children?: ReactNode }) {
    const [slot, setSlot] = useState<HTMLElement | null>(null);
    return (
        <StepAsideSlot.Provider value={slot}>
            <header className={cx("rt-shead rt-shead-page", className)}>
                <div className="rt-shead-lead">
                    <div className="rt-shead-num" aria-hidden="true"><span><RollText value={pad2(number)} dir={dir} /></span></div>
                    <div className="rt-shead-titles">
                        <h1 className={SHEAD_TITLE[1]}><RollText value={title} dir={dir} /></h1>
                        <p className="rt-shead-dek"><RollText value={dek} dir={dir} /></p>
                    </div>
                </div>
                <div className="rt-shead-aside" ref={setSlot} />
            </header>
            {children}
        </StepAsideSlot.Provider>
    );
}

/** A page's own actions, shown beside the step head. They stay part of the page: its state, and they come and go with it. */
export function StepAside({ children }: { children: ReactNode }) {
    const slot = useContext(StepAsideSlot);
    return slot ? createPortal(children, slot) : null;
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
    pattern?: SwatchPattern;
    image?: string;
    /** A drawing of the piece, centred on the colour plate (under any photo). */
    art?: ReactNode;
    price: ReactNode;
    qty?: number;
    owned: boolean;
    /** Overrides `owned` for the tag: a sketch is neither owned nor on the shopping list. */
    status?: "owned" | "tobuy" | "sketch";
    worn?: number;
    onSelect?: () => void;
    /** Makes the whole card a link (the app links to the item's detail page). Takes precedence over `onSelect`. */
    href?: string;
    id?: string;
    className?: string;
}

export function GarmentCard(p: GarmentCardProps) {
    const inner = (
        <>
            {/* A photo may be a transparent cutout: keep it on a neutral ground so dark cloth doesn't vanish into its own colour. */}
            <div className="rt-garment-plate" style={{ background: p.image ? "var(--garment-ground)" : p.color ? swatchBackground(p.color, p.stripe, 10, p.pattern) : "var(--paper-sunk)" }}>
                {p.art ? <span className="rt-garment-art" aria-hidden="true">{p.art}</span> : null}
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
    if (p.href) return <a id={p.id} className={cx("rt-garment", p.className)} href={p.href}>{inner}</a>;
    return p.onSelect ? (
        <button type="button" id={p.id} className={cx("rt-garment", p.className)} onClick={p.onSelect}>
            {inner}
        </button>
    ) : (
        <article id={p.id} className={cx("rt-garment", p.className)}>{inner}</article>
    );
}

/* ---------- OverflowText ---------- */

/**
 * One line of text that ends in an ellipsis when it doesn't fit, and shows the whole of itself in a tooltip on hover
 * or keyboard focus. The tooltip only appears when the text is actually cut off. It stays open while the pointer is
 * over it, and Escape closes it. It is visual only: the full text is already the element's accessible name, so screen
 * readers would otherwise hear it twice.
 */
export function OverflowText({ text, href, className }: { text: string; href?: string; className?: string }) {
    const ref = useRef<HTMLElement>(null);
    const tipRef = useRef<HTMLDivElement>(null);
    const timer = useRef<number | undefined>(undefined);
    const [anchor, setAnchor] = useState<DOMRect | null>(null);

    const later = (fn: () => void, ms: number) => {
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(fn, ms);
    };
    const open = (ms: number) => later(() => {
        const el = ref.current;
        if (el && el.scrollWidth > el.clientWidth) setAnchor(el.getBoundingClientRect());
    }, ms);
    const close = (ms = 0) => later(() => setAnchor(null), ms);
    const stay = () => window.clearTimeout(timer.current);

    useEffect(() => () => window.clearTimeout(timer.current), []);
    useEffect(() => {
        if (!anchor) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAnchor(null); };
        const onMove = () => setAnchor(null);
        document.addEventListener("keydown", onKey);
        window.addEventListener("scroll", onMove, true);
        window.addEventListener("resize", onMove);
        return () => {
            document.removeEventListener("keydown", onKey);
            window.removeEventListener("scroll", onMove, true);
            window.removeEventListener("resize", onMove);
        };
    }, [anchor]);
    // Above the text, or below when there is no room; kept 8px inside the window either side.
    useLayoutEffect(() => {
        const tip = tipRef.current;
        if (!tip || !anchor) return;
        const { width, height } = tip.getBoundingClientRect();
        const above = anchor.top - height - 6;
        tip.style.top = (above >= 8 ? above : anchor.bottom + 6) + "px";
        tip.style.left = Math.max(8, Math.min(anchor.left - 8, window.innerWidth - width - 8)) + "px";
    }, [anchor]);

    const props = {
        className: cx("rt-overflow", className),
        onPointerEnter: () => open(250),
        onPointerLeave: () => close(120),
        onFocus: () => open(0),
        onBlur: () => close(),
    };
    return (
        <>
            {href ? <a ref={ref as RefObject<HTMLAnchorElement>} href={href} {...props}>{text}</a> : <span ref={ref} {...props}>{text}</span>}
            {anchor
                ? createPortal(
                      <div ref={tipRef} className="rt-tip" aria-hidden="true" onPointerEnter={stay} onPointerLeave={() => close(120)}>
                          {text}
                      </div>,
                      document.body,
                  )
                : null}
        </>
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
                    <span key={x.id ?? x.slot} style={{ background: x.color! }} />
                ))}
            </div>
            <div className={cx("rt-look-main", p.figure != null && "has-figure")}>
                {p.figure != null ? <div className="rt-look-figure">{p.figure}</div> : null}
                <ul className="rt-pieces">
                    {p.pieces.map((pc) => (
                        <li key={pc.id ?? pc.slot} className="rt-piece">
                            <Kicker>{SLOT_LABEL[pc.slot]}</Kicker>
                            <Swatch color={pc.color} stripe={pc.stripe} pattern={pc.pattern} />
                            {pc.name ? (
                                <OverflowText className="rt-piece-name" text={pc.name} href={p.onSelect ? undefined : pc.href} />
                            ) : (
                                <span className="rt-piece-name rt-piece-empty">None</span>
                            )}
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
                        <Swatch key={x.id ?? x.slot} color={x.color} stripe={x.stripe} pattern={x.pattern} />
                    ))}
                </span>
                <span className="rt-day-list">
                    {p.pieces.filter((x) => x.name).map((x) => (
                        <span key={x.id ?? x.slot}>{x.name}</span>
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
    swatch?: { color: string; stripe?: string; pattern?: SwatchPattern } | null;
    /** A status shown in the menu row (not in the trigger). */
    tag?: { label: string; tone: "owned" | "tobuy" | "sketch" };
    /** An action ("Create a piece…"): listed first, above a separator; calls onAction, never becomes the value. */
    action?: true;
}

export function Select({ id, label, value, onChange, options, extra, hint, className, onHighlight, onAction, placeholder }: FieldBase & {
    id: string;
    /** "" shows the placeholder: for pickers that add to a list rather than hold a value. */
    value: string;
    placeholder?: string;
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
                    {o.swatch !== undefined ? <Swatch color={o.swatch?.color} stripe={o.swatch?.stripe} pattern={o.swatch?.pattern} /> : null}
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
                    <RSelect.Value placeholder={placeholder} />
                    <RSelect.Icon className="rt-select-icon" aria-hidden="true">
                        <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" /></svg>
                    </RSelect.Icon>
                </RSelect.Trigger>
                <RSelect.Portal>
                    <RSelect.Content className="rt-select-menu" position="popper" sideOffset={4}>
                        <RSelect.Viewport>
                            {actions.map(item)}
                            {actions.length ? <RSelect.Separator className="rt-select-sep" /> : null}
                            {values.map(item)}
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
    const rootRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLSpanElement>(null);
    // The dark thumb slides to the chosen option. It snaps into place on first paint (no transition until measured once),
    // and follows the option when the control resizes or wraps.
    useLayoutEffect(() => {
        const root = rootRef.current;
        const thumb = thumbRef.current;
        if (!root || !thumb) return;
        const place = () => {
            const on = root.querySelector<HTMLElement>('.rt-seg-item[data-state="on"]');
            if (!on) return void (thumb.style.opacity = "0");
            if (!on.offsetWidth) return; // Hidden (e.g. a closed sheet): measure once it shows.
            thumb.style.opacity = "1";
            thumb.style.width = on.offsetWidth + "px";
            thumb.style.height = on.offsetHeight + "px";
            thumb.style.transform = `translate(${on.offsetLeft}px, ${on.offsetTop}px)`;
            if (!root.hasAttribute("data-ready")) {
                thumb.getBoundingClientRect(); // Commit the first position before transitions switch on.
                root.setAttribute("data-ready", "");
            }
        };
        place();
        const ro = typeof ResizeObserver === "function" ? new ResizeObserver(place) : null;
        ro?.observe(root);
        return () => ro?.disconnect();
    }, [value, options.length]);
    return (
        // Ignore deselection: one option is always chosen.
        <RToggleGroup.Root ref={rootRef} type="single" className="rt-seg" aria-label={label} value={value} onValueChange={(v) => { if (v) onChange(v as T); }}>
            <span ref={thumbRef} className="rt-seg-thumb" aria-hidden="true" />
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
    /** Called with false on Escape, the close button, or a click on the scrim. The consumer may refuse. */
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
    const side = useMedia(WIDE);
    const titleRef = useRef<HTMLHeadingElement>(null);

    // Modal in both modes, over a scrim: clicking the scrim closes it. The panel is fixed over the page,
    // which keeps its width (the scroll lock leaves the scrollbar gutter alone), so nothing behind it moves.
    return (
        <RDialog.Root open={p.open} onOpenChange={p.onOpenChange}>
            <RDialog.Portal>
                <RDialog.Overlay className="rt-sheet-overlay" />
                <RDialog.Content
                    className={cx("rt-sheet", p.className)}
                    data-mode={side ? "side" : "bottom"}
                    {...(p.description ? {} : { "aria-describedby": undefined })}
                    onOpenAutoFocus={(e) => { e.preventDefault(); titleRef.current?.focus(); }}
                    onCloseAutoFocus={(e) => { if (p.returnFocusRef?.current) { e.preventDefault(); p.returnFocusRef.current.focus(); } }}
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
