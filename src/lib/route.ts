/** Hash routes: `#<view>` or `#rotation/day/<n>` (n is a 0-based look index). */

export type ViewId = "wardrobe" | "outfits" | "rotation" | "print";
/** The order you work through the app: enter clothes, combine them, schedule them, print. */
export const VIEW_ORDER: ViewId[] = ["wardrobe", "outfits", "rotation", "print"];

export interface Route {
  view: ViewId;
  /** The rotation day whose editing panel is open, or null. Only set on the rotation view. */
  day: number | null;
}

export function parseHash(hash: string, lookCount: number): Route {
  const [head, key, n] = hash.replace(/^#/, "").split("/");
  const view = VIEW_ORDER.find((v) => v === head) ?? "wardrobe";
  if (view !== "rotation" || key !== "day" || !/^\d+$/.test(n ?? "")) return { view, day: null };
  const day = Number(n);
  return { view, day: day < lookCount ? day : null };
}

export function formatHash(route: Route): string {
  return route.view === "rotation" && route.day !== null ? `#rotation/day/${route.day}` : "#" + route.view;
}
