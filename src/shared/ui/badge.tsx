import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/utils/cn";
import { aliosFocusRing, aliosSubtleOutlineMotion } from "./motion";

const badgeVariants = cva(
  cn(
    "inline-flex max-w-full items-center whitespace-normal break-words rounded-full border px-2.5 py-0.5 text-start text-xs font-semibold",
    aliosFocusRing,
    aliosSubtleOutlineMotion
  ),
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-alios-caspian text-white hover:bg-alios-caspian/85 dark:bg-alios-paper dark:text-alios-night",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
