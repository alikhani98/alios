import * as React from "react";

import { cn } from "@/shared/utils/cn";
import { aliosFocusRing, aliosInteractiveMotion } from "./motion";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-base leading-7 ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[100px] sm:text-sm",
          aliosFocusRing,
          aliosInteractiveMotion,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
