/** Hash routes: `#<view>`, `#rotation/day/<n>` (n is a 0-based look index) or `#wardrobe/item/<id>`. */

export type ViewId = "wardrobe" | "outfits" | "rotation" | "print";
/** The order you work through the app: enter clothes, combine them, schedule them, print. */
export const VIEW_ORDER: ViewId[] = ["wardrobe", "outfits", "rotation", "print"];

export interface Route {
  view: ViewId;
  /** The rotation day whose editing panel is open, or null. Only set on the rotation view. */
  day: number | null;
  /** The wardrobe item whose detail page is open. Only set on the wardrobe view. */
  item?: string;
}

export function parseHash(hash: string, lookCount: number): Route {
  const [head, key, n] = hash.replace(/^#/, "").split("/");
  const view = VIEW_ORDER.find((v) => v === head) ?? "wardrobe";
  if (view === "wardrobe" && key === "item" && n) {
    try {
      return { view, day: null, item: decodeURIComponent(n) };
    } catch {
      return { view, day: null };
    }
  }
  if (view !== "rotation" || key !== "day" || !/^\d+$/.test(n ?? "")) return { view, day: null };
  const day = Number(n);
  return { view, day: day < lookCount ? day : null };
}

export function formatHash(route: Route): string {
  if (route.view === "wardrobe" && route.item) return itemHash(route.item);
  return route.view === "rotation" && route.day !== null ? `#rotation/day/${route.day}` : "#" + route.view;
}

/** Link to an item's detail page. */
export const itemHash = (id: string) => "#wardrobe/item/" + encodeURIComponent(id);

export type StepDir = "forward" | "back";

/** Which way a move between views animates; moves within a view (item detail, a day) are null. */
export function stepChange(prev: ViewId, next: ViewId): StepDir | null {
  if (prev === next) return null;
  return VIEW_ORDER.indexOf(next) > VIEW_ORDER.indexOf(prev) ? "forward" : "back";
}
