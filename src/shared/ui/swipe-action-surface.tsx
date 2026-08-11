import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";

import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/utils";

type SwipeActionSurfaceProps = {
  children: ReactNode;
  className?: string;
  processLabel: ReactNode;
  deleteLabel: ReactNode;
  onProcess: () => void;
  onDeleteIntent: () => void;
  processDisabled?: boolean;
  deleteDisabled?: boolean;
};

const SWIPE_THRESHOLD = 72;
const SWIPE_MAX_OFFSET = 96;

export function SwipeActionSurface({
  children,
  className,
  processLabel,
  deleteLabel,
  onProcess,
  onDeleteIntent,
  processDisabled = false,
  deleteDisabled = false,
}: SwipeActionSurfaceProps) {
  const { direction } = useI18n();
  const [startX, setStartX] = useState<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);

  const processDirection = direction === "rtl" ? -1 : 1;
  const deleteDirection = processDirection * -1;
  const boundedOffset = useMemo(
    () => Math.max(-SWIPE_MAX_OFFSET, Math.min(SWIPE_MAX_OFFSET, offsetX)),
    [offsetX]
  );

  const reset = () => {
    setStartX(null);
    setOffsetX(0);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") {
      return;
    }

    setStartX(event.clientX);
    setOffsetX(0);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (startX === null || event.pointerType === "mouse") {
      return;
    }

    const nextOffset = event.clientX - startX;
    if (Math.abs(nextOffset) > 8) {
      setOffsetX(nextOffset);
    }
  };

  const handlePointerUp = () => {
    const logicalDistance = boundedOffset * processDirection;
    if (logicalDistance > SWIPE_THRESHOLD && !processDisabled) {
      onProcess();
    } else if (boundedOffset * deleteDirection > SWIPE_THRESHOLD && !deleteDisabled) {
      onDeleteIntent();
    }

    reset();
  };

  return (
    <div
      className={cn("relative min-w-0 overflow-hidden rounded-2xl", className)}
      onPointerCancel={reset}
      onPointerDown={handlePointerDown}
      onPointerLeave={reset}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="absolute inset-0 flex items-stretch justify-between gap-2 md:hidden">
        <button
          type="button"
          className="flex min-h-11 w-28 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 px-3 text-sm font-semibold text-destructive"
          disabled={deleteDisabled}
          onClick={onDeleteIntent}
        >
          {deleteLabel}
        </button>
        <button
          type="button"
          className="flex min-h-11 w-28 items-center justify-center rounded-2xl border border-alios-herb/25 bg-alios-herb/10 px-3 text-sm font-semibold text-alios-herb"
          disabled={processDisabled}
          onClick={onProcess}
        >
          {processLabel}
        </button>
      </div>
      <div
        className="relative transition-transform duration-150 ease-out motion-reduce:transition-none md:translate-x-0"
        style={{
          transform: boundedOffset ? `translateX(${boundedOffset}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
