import { describe, expect, it } from "bun:test";
import {
  buildThemeIdeas,
  detectSurface,
  formatThemeIdeaReply,
  isBrainstormRequest,
  isExplicitPaletteRequest,
  parseIdeaSelection,
} from "./chatIntent";

describe("chatIntent", () => {
  it("treats idea-seeking prompts as brainstorm requests", () => {
    const prompt =
      "hi can you help me what idea theme we can use for a desktop app? give me few style idea so I can chose one";
    expect(isBrainstormRequest(prompt)).toBe(true);
    expect(isExplicitPaletteRequest(prompt)).toBe(false);
  });

  it("detects explicit palette generation requests", () => {
    expect(
      isExplicitPaletteRequest(
        "generate a dark professional palette for a desktop app",
      ),
    ).toBe(true);
    expect(isBrainstormRequest("generate a dark professional palette")).toBe(
      false,
    );
  });

  it("builds surface-aware ideas", () => {
    const prompt = "I need theme ideas for desktop app";
    expect(detectSurface(prompt)).toBe("desktop");

    const ideas = buildThemeIdeas(prompt);
    expect(ideas.length).toBe(4);
    expect(ideas[0].moodPrompt.toLowerCase()).toContain("desktop");
  });

  it("formats a numbered brainstorm response", () => {
    const ideas = buildThemeIdeas("desktop theme ideas");
    const text = formatThemeIdeaReply("desktop theme ideas", ideas);
    expect(text).toContain("1.");
    expect(text).toContain("Reply with a number");
  });

  it("parses numeric and ordinal option selection", () => {
    expect(parseIdeaSelection("2", 4)).toBe(1);
    expect(parseIdeaSelection("option 3", 4)).toBe(2);
    expect(parseIdeaSelection("let's go with the second one", 4)).toBe(1);
    expect(parseIdeaSelection("show me more", 4)).toBeNull();
  });
});
