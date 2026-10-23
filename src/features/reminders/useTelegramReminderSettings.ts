import { useEffect, useRef, useState } from "react";

import { useAuthSession } from "@/core/auth";
import { getSupabaseSyncConfiguration } from "@/core/sync";
import type { TranslationKey } from "@/shared/i18n";

import {
  defaultTelegramReminderPreference,
  getBrowserTimeZone,
  normalizeTelegramReminderPreference,
  validateTelegramReminderPreference,
  type ReminderDeliveryChannel,
  type TelegramReminderPreference,
  type TelegramReminderPreferenceInput,
} from "./telegramReminderSettings";
import {
  loadTelegramReminderPreference,
  saveTelegramReminderPreference,
  sendTelegramReminderTest,
} from "./telegramReminderSettingsClient";

type PendingAction = "load" | "save" | "channel" | "test" | null;
type Feedback = { tone: "success" | "danger"; key: TranslationKey } | null;

function createDraft(): TelegramReminderPreference {
  return { ...defaultTelegramReminderPreference, timezone: getBrowserTimeZone() };
}

export function useTelegramReminderSettings(active = true) {
  const session = useAuthSession();
  const isSupabaseConfigured = getSupabaseSyncConfiguration() !== null;
  const scope = session.status === "authenticated" && isSupabaseConfigured
    ? `${session.provider}:${session.user?.userId ?? ""}`
    : null;
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const generation = useRef(0);
  const activeRef = useRef(active);
  activeRef.current = active;
  const loadedScope = useRef<string | null>(null);
  const busy = useRef(false);
  const [revision, setRevision] = useState(0);
  const [preference, setPreference] = useState<TelegramReminderPreference | null>(null);
  const [draft, setDraft] = useState(createDraft);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    loadedScope.current = null;
    setPreference(null);
    setDraft(createDraft());
    setFeedback(null);
  }, [scope, revision]);

  useEffect(() => {
    const request = ++generation.current;
    const isCurrent = () => activeRef.current && generation.current === request && scopeRef.current === scope;
    const shouldLoad = active && scope !== null && loadedScope.current !== scope;
    busy.current = shouldLoad;
    setPendingAction(shouldLoad ? "load" : null);
    if (shouldLoad) {
      void loadTelegramReminderPreference().then((saved) => {
        if (!isCurrent()) return;
        loadedScope.current = scope;
        setPreference(saved);
        setDraft(saved);
      }).catch(() => {
        if (isCurrent()) setFeedback({ tone: "danger", key: "settings.telegramReminderLoadError" });
      }).finally(() => {
        if (!isCurrent()) return;
        busy.current = false;
        setPendingAction(null);
      });
    }
    return () => {
      generation.current += 1;
      // A hidden in-flight request cannot establish a usable cached preference.
      if (busy.current) loadedScope.current = null;
      busy.current = false;
    };
  }, [active, scope, revision]);

  const setField = <Key extends Exclude<keyof TelegramReminderPreferenceInput, "channel">>(
    key: Key, value: TelegramReminderPreferenceInput[Key]
  ) => {
    if (!activeRef.current || busy.current || scope === null || !preference) return;
    setDraft((current) => ({ ...current, [key]: value }));
    setFeedback(null);
  };

  const run = async (
    action: Exclude<PendingAction, "load" | null>,
    operation: () => Promise<void>,
    errorKey: TranslationKey
  ) => {
    if (!activeRef.current || busy.current || scope === null || !preference) return;
    busy.current = true;
    const request = generation.current;
    setPendingAction(action);
    setFeedback(null);
    try {
      await operation();
    } catch {
      if (generation.current === request && scopeRef.current === scope) {
        setFeedback({ tone: "danger", key: errorKey });
      }
    } finally {
      if (generation.current === request && scopeRef.current === scope) {
        busy.current = false;
        setPendingAction(null);
      }
    }
  };

  const saveSettings = async (channel?: ReminderDeliveryChannel) => {
    if (!activeRef.current || !preference || busy.current) return;
    const selectedChannel = channel ?? preference.channel;
    if (selectedChannel === "both") {
      setFeedback({ tone: "danger", key: "reminders.channelSelector.legacyBoth" });
      return;
    }
    const resolvingLegacy = preference.channel === "both";
    // Configuration saves preserve the committed channel; only the selector supplies a new one.
    // Resolving `both` explicitly commits the visible configuration, including a newly entered Chat ID.
    const input = normalizeTelegramReminderPreference(channel === undefined || resolvingLegacy
      ? { ...draft, channel: selectedChannel }
      : { ...preference, channel: selectedChannel });
    if (preference.channel !== "both" && JSON.stringify(input) === JSON.stringify(
      normalizeTelegramReminderPreference({ ...preference, channel: preference.channel })
    )) return;
    const validation = validateTelegramReminderPreference(input) as TranslationKey | null;
    if (validation) {
      setFeedback({ tone: "danger", key: validation });
      return;
    }
    const request = generation.current;
    await run(channel === undefined ? "save" : "channel", async () => {
      const saved = await saveTelegramReminderPreference(input);
      if (generation.current !== request || scopeRef.current !== scope) return;
      setPreference(saved);
      // Selecting a channel must not discard an unfinished configuration draft.
      setDraft((current) => channel === undefined || resolvingLegacy ? saved : { ...current, channel: saved.channel });
      setFeedback({ tone: "success", key: "settings.telegramReminderSaveSuccess" });
    }, "settings.telegramReminderSaveError");
  };

  const sendTest = async () => {
    if (!activeRef.current || busy.current || !draft.telegramChatId.trim()) return;
    const validation = validateTelegramReminderPreference({ ...draft, channel: "telegram", enabled: true }) as TranslationKey | null;
    if (validation) {
      setFeedback({ tone: "danger", key: validation });
      return;
    }
    const request = generation.current;
    await run("test", async () => {
      await sendTelegramReminderTest(draft.telegramChatId);
      if (generation.current === request && scopeRef.current === scope) {
        setFeedback({ tone: "success", key: "settings.telegramReminderTestSuccess" });
      }
    }, "settings.telegramReminderTestError");
  };

  return {
    preference, draft, pendingAction, feedback, isSupabaseConfigured,
    canUseRemoteSettings: scope !== null,
    isBusy: pendingAction !== null,
    setField,
    saveSettings: () => saveSettings(),
    changeChannel: (channel: ReminderDeliveryChannel) => saveSettings(channel),
    sendTest,
    retry: () => {
      if (activeRef.current && !busy.current) setRevision((current) => current + 1);
    },
  };
}

export type TelegramReminderSettingsController = ReturnType<typeof useTelegramReminderSettings>;
