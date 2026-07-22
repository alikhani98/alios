export const TEMPLATE_MARQUEE_DRAG_THRESHOLD_PX = 6;

export type TemplateMarqueeMotionInput = {
  itemCount: number;
  prefersReducedMotion: boolean;
  isCoarsePointer: boolean;
};

export type TemplateMarqueeLoopItem<T> = {
  item: T;
  isDuplicate: boolean;
};

export function shouldAutoScrollTemplateMarquee({
  itemCount,
  prefersReducedMotion,
  isCoarsePointer,
}: TemplateMarqueeMotionInput): boolean {
  return itemCount > 1 && !prefersReducedMotion && !isCoarsePointer;
}

export function buildTemplateMarqueeLoopItems<T>(
  items: readonly T[],
  shouldLoop: boolean
): Array<TemplateMarqueeLoopItem<T>> {
  const canonicalItems = items.map((item) => ({ item, isDuplicate: false }));

  if (!shouldLoop) {
    return canonicalItems;
  }

  return [
    ...canonicalItems,
    ...items.map((item) => ({ item, isDuplicate: true })),
  ];
}

export function shouldSuppressTemplateClickAfterDrag(
  deltaX: number,
  deltaY: number,
  threshold = TEMPLATE_MARQUEE_DRAG_THRESHOLD_PX
): boolean {
  return Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY);
}
