export const aliosFocusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export const aliosInteractiveMotion =
  "transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none";

export const aliosInteractiveLift =
  "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0";

export const aliosSurfaceMotion =
  "transition-[transform,box-shadow,border-color,background-color,color,opacity] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none";

export const aliosPopoverMotion =
  "motion-safe:animate-[alios-popover-in_180ms_ease-out_both] motion-reduce:animate-none";

export const aliosSectionMotion =
  "motion-safe:animate-[alios-fade-up_220ms_ease-out_both] motion-reduce:animate-none";

export const aliosSubtleOutlineMotion =
  "transition-[background-color,border-color,box-shadow,color,opacity] duration-200 ease-out motion-reduce:transition-none";

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
