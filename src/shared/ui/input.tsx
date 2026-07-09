import * as React from "react";

import { cn } from "@/shared/utils";
import { aliosFocusRing, aliosInteractiveMotion } from "./motion";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background file:me-3 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
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
Input.displayName = "Input";

export { Input };
