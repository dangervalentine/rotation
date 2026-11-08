import { outline, skinOf, type Paint } from "./paint.ts";

/** Hair has a back part (behind the body, for long hair) and a front part. Cartoon only. */
export function head(p: Paint, part: "back" | "front") {
  const skin = skinOf(p);
  const hair = p.figure?.hair || "#4a3426";
  const style = p.figure?.hairStyle || "short";
  const st = outline(p);
  if (part === "back") {
    if (style === "long") return `<path d="M38 2 Q36 34 42 46 L78 46 Q84 34 82 2 Z" fill="${hair}" ${st}/>`;
    return "";
  }
  let s = `<path d="M54 16 L66 16 L66 30 L54 30 Z" fill="${skin}" ${st}/>`;
  s += `<ellipse cx="60" cy="4" rx="20" ry="21" fill="${skin}" ${st}/>`;
  s += hairFront(style, hair, st);
  // Face
  s += `<circle cx="53" cy="5" r="2" fill="${p.ink}"/><circle cx="67" cy="5" r="2" fill="${p.ink}"/>`;
  s += `<circle cx="53.7" cy="4.3" r="0.6" fill="#fff"/><circle cx="67.7" cy="4.3" r="0.6" fill="#fff"/>`;
  s += `<ellipse cx="48" cy="11" rx="3.2" ry="2" fill="#f19aa6" opacity="0.6"/><ellipse cx="72" cy="11" rx="3.2" ry="2" fill="#f19aa6" opacity="0.6"/>`;
  s += `<path d="M55 12 Q60 17 65 12" fill="none" ${st}/>`;
  return s;
}

function hairFront(style: string, hair: string, st: string) {
  if (style === "short") return `<path d="M40 2 Q40 -18 60 -18 Q80 -18 80 2 Q72 -6 62 -5 Q52 -9 40 2 Z" fill="${hair}" ${st}/>`;
  if (style === "long") return `<path d="M40 6 Q38 -18 60 -18 Q82 -18 80 6 Q76 -4 66 -6 Q58 2 46 -2 Q42 2 40 6 Z" fill="${hair}" ${st}/>`;
  if (style === "bun") return `<circle cx="60" cy="-20" r="7" fill="${hair}" ${st}/><path d="M40 2 Q40 -16 60 -16 Q80 -16 80 2 Q70 -8 60 -8 Q50 -8 40 2 Z" fill="${hair}" ${st}/>`;
  if (style === "curly")
    return `<path d="M40 4 Q34 -2 40 -8 Q38 -18 48 -18 Q52 -24 60 -20 Q68 -24 72 -18 Q82 -18 80 -8 Q86 -2 80 4 Q76 -4 70 -4 Q64 -8 60 -4 Q54 -8 50 -4 Q44 -4 40 4 Z" fill="${hair}" ${st}/>`;
  return "";
}
