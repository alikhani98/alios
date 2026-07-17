import * as React from "react";

import { cn } from "@/shared/utils/cn";

import { aliosFocusRing, aliosInteractiveMotion } from "./motion";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
        aliosFocusRing,
        aliosInteractiveMotion,
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

export { Select };
