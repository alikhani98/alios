export const aliosFocusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export const aliosInteractiveMotion =
  "transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-[180ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] motion-reduce:transition-none motion-reduce:transform-none";

export const aliosInteractiveLift =
  "hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md";

export const aliosSurfaceMotion =
  "transition-[transform,box-shadow,border-color,background-color] duration-[220ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] motion-reduce:transition-none motion-reduce:transform-none";

export const aliosPopoverMotion =
  "motion-safe:animate-[alios-popover-in_180ms_ease-out_both] motion-reduce:animate-none";

export const aliosSectionMotion =
  "motion-safe:animate-[alios-fade-up_260ms_cubic-bezier(0.25,0.46,0.45,0.94)_both] motion-reduce:animate-none";

export const aliosSubtleOutlineMotion =
  "transition-[background-color,border-color,box-shadow,color,opacity] duration-[180ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] motion-reduce:transition-none";

export const aliosListItemMotion =
  "animate-alios-fade-up opacity-0 [animation-fill-mode:forwards]";

export function aliosStaggerDelay(index: number): string {
  const delays = [
    "animation-delay-0",
    "animation-delay-75",
    "animation-delay-150",
    "animation-delay-225",
    "animation-delay-300",
  ];
  return delays[Math.min(index, delays.length - 1)];
}
