import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders correctly with children", () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeTruthy();
  });

  test("applies variant classes", () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    const button = container.firstChild as HTMLElement;
    expect(button.className).toContain("bg-danger");
  });

  test("applies size classes", () => {
    const { container } = render(<Button size="sm">Small</Button>);
    const button = container.firstChild as HTMLElement;
    expect(button.className).toContain("h-8");
  });

  test("handles click events", () => {
    let clicked = false;
    render(
      <Button
        onClick={() => {
          clicked = true;
        }}
      >
        Action
      </Button>,
    );
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(clicked).toBe(true);
  });

  test("is disabled when specified", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");
    expect(button.hasAttribute("disabled")).toBe(true);
  });
});
