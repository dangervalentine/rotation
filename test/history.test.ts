import { describe, expect, it } from "vitest";
import { canRedo, canUndo, HISTORY_CAP, initHistory, push, redo, resetHistory, undo } from "../src/lib/history.ts";

describe("history", () => {
  it("ignores a push equal to the present", () => {
    const h = initHistory({ a: 1 });
    expect(push(h, { a: 1 })).toBe(h);
  });
  it("undoes and redoes", () => {
    let h = push(push(initHistory(1), 2), 3);
    h = undo(h);
    expect(h.present).toBe(2);
    h = undo(h);
    expect(h.present).toBe(1);
    expect(canUndo(h)).toBe(false);
    h = redo(redo(h));
    expect(h.present).toBe(3);
    expect(canRedo(h)).toBe(false);
  });
  it("is a no-op when there is nothing to undo or redo", () => {
    const h = initHistory(1);
    expect(undo(h)).toBe(h);
    expect(redo(h)).toBe(h);
  });
  it("clears redo on a new push", () => {
    const h = push(undo(push(initHistory(1), 2)), 5);
    expect(h.present).toBe(5);
    expect(canRedo(h)).toBe(false);
  });
  it("keeps the last 50 steps", () => {
    let h = initHistory(0);
    for (let i = 1; i <= HISTORY_CAP + 1; i++) h = push(h, i);
    expect(h.past).toHaveLength(HISTORY_CAP);
    expect(h.past[0]).toBe(1);
  });
  it("resets", () => {
    const h = resetHistory(9);
    expect(h).toEqual({ past: [], present: 9, future: [] });
  });
});
