import { useEffect } from "react";

type UseCommandPaletteShortcutOptions = {
  enabled?: boolean;
  onOpen: () => void;
};

export function useCommandPaletteShortcut({
  enabled = true,
  onOpen,
}: UseCommandPaletteShortcutOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const isCommandPaletteShortcut =
        event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey);

      if (!isCommandPaletteShortcut) {
        return;
      }

      event.preventDefault();
      onOpen();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onOpen]);
}
