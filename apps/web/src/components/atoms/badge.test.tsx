import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders correctly with text content", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeTruthy();
  });

  test("applies default variant classes", () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-primary/15");
  });

  test("applies secondary variant classes", () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-secondary/20");
  });

  test("applies success variant classes", () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-success/20");
  });

  test("applies error variant classes", () => {
    const { container } = render(<Badge variant="error">Error</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-error/20");
  });

  test("renders with custom className", () => {
    const { container } = render(
      <Badge className="custom-class">Custom</Badge>,
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("custom-class");
  });
});
