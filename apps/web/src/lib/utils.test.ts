import { describe, expect, it } from "bun:test";
import { cn } from "./utils";

describe("utils", () => {
  describe("cn", () => {
    it("merges class names", () => {
      expect(cn("a", "b")).toBe("a b");
    });

    it("handles conditional classes", () => {
      expect(cn("a", true && "b", false && "c")).toBe("a b");
    });

    it("merges tailwind classes correctly", () => {
      expect(cn("px-2 py-2", "px-4")).toBe("py-2 px-4");
    });
  });
});
