"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxRows?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onChange, maxRows = 8, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Merge refs
    React.useImperativeHandle(
      ref,
      () => textareaRef.current as HTMLTextAreaElement,
    );

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Reset height to calculate scrollHeight correctly
      textarea.style.height = "auto";

      const singleRowHeight = 20; // text-sm is ~20px line-height
      const maxHeight = maxRows * singleRowHeight + 16; // 16px padding (py-2)

      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;

      // Toggle scrolling based on max height
      textarea.style.overflowY =
        textarea.scrollHeight > maxHeight ? "auto" : "hidden";
    }, [maxRows]);

    React.useEffect(() => {
      if (props.value !== undefined) {
        adjustHeight();
      }
    }, [adjustHeight, props.value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      onChange?.(e);
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[40px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          className,
        )}
        ref={textareaRef}
        onChange={handleChange}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
