import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/utils/cn";
import {
  aliosFocusRing,
  aliosInteractiveMotion,
} from "./motion";

const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-normal rounded-control text-center text-sm font-semibold leading-5 ring-offset-background disabled:pointer-events-none disabled:opacity-50",
    aliosFocusRing,
    aliosInteractiveMotion
  ),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:outline hover:outline-1 hover:outline-offset-2 hover:outline-primary/40",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input/80 bg-background hover:bg-accent hover:border-border hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent/70 hover:text-accent-foreground active:bg-accent/90",
        link: "text-[color:var(--alios-accent-text)] underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 px-5 py-2.5",
        sm: "min-h-11 rounded-lg px-3.5 py-2 text-xs sm:min-h-10",
        lg: "min-h-12 rounded-control px-8 py-3 text-base",
        icon: "h-11 w-11 shrink-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
