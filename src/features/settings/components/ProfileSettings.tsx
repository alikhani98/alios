import { Upload, Trash2, UserCircle } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { DISPLAY_NAME_STORAGE_KEY, PROFILE_AVATAR_IMAGE_STORAGE_KEY } from "@/shared/constants/preferences";
import { usePersistentString } from "@/shared/hooks/usePersistentString";
import { useI18n } from "@/shared/i18n";
import { getDisplayNameInitials, normalizeDisplayName } from "@/shared/preferences/profile";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@/shared/ui";
import { isStoredProfileAvatarImage, resizeProfileAvatarImage } from "../profileAvatarImage";

export function ProfileSettings() {
  const { t, language } = useI18n();
  const { value: name, setStoredValue: storeName } = usePersistentString({ key: DISPLAY_NAME_STORAGE_KEY, defaultValue: "" });
  const { value: photo, setStoredValue: storePhoto } = usePersistentString({ key: PROFILE_AVATAR_IMAGE_STORAGE_KEY, defaultValue: "" });
  const [draft, setDraft] = useState(name);
  const [photoDraft, setPhotoDraft] = useState(photo);
  const nameDirty = useRef(false);
  const photoDirty = useRef(false);
  const mounted = useRef(true);
  const operation = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);
  const [processing, setProcessing] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [photoError, setPhotoError] = useState<"storage" | "image" | null>(null);
  const [nameSaved, setNameSaved] = useState(false);
  const [photoSaved, setPhotoSaved] = useState(false);
  useEffect(() => { if (!nameDirty.current) setDraft(name); }, [name]);
  useEffect(() => { if (!photoDirty.current) setPhotoDraft(photo); }, [photo]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; operation.current++; };
  }, []);
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || processingRef.current) return;
    const token = ++operation.current;
    processingRef.current = true;
    setProcessing(true); setPhotoError(null); setPhotoSaved(false);
    try {
      const image = await resizeProfileAvatarImage(file);
      if (mounted.current && token === operation.current) {
        photoDirty.current = true;
        setPhotoDraft(image);
      }
    } catch {
      if (mounted.current && token === operation.current) setPhotoError("image");
    } finally {
      input.value = "";
      if (token === operation.current) processingRef.current = false;
      if (mounted.current && token === operation.current) setProcessing(false);
    }
  };
  const saveName = (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizeDisplayName(draft);
    const saved = storeName(normalized);
    setNameError(!saved); setNameSaved(saved);
    if (saved) { nameDirty.current = false; setDraft(normalized); }
  };
  const savePhoto = () => {
    if (processingRef.current) return;
    // The image key is the sole source of truth already used by the shell.
    // No legacy avatar-mode write or multi-key partial transaction is needed.
    const saved = storePhoto(photoDraft);
    setPhotoError(saved ? null : "storage"); setPhotoSaved(saved);
    if (saved) photoDirty.current = false;
  };
  const cancelPhoto = () => {
    operation.current++; processingRef.current = false; setProcessing(false);
    photoDirty.current = false; setPhotoDraft(photo); setPhotoError(null); setPhotoSaved(false);
  };
  return <Card id="settings-profile" className="shadow-none">
    <CardHeader><CardTitle>{t("settings.localProfile")}</CardTitle><CardDescription>{t("settings.localOnlyProfile")}</CardDescription></CardHeader>
    <CardContent className="space-y-6">
      <section aria-label={t("settings.profileAvatarPhoto")} className="space-y-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-2xl font-semibold">
            {isStoredProfileAvatarImage(photoDraft) ? <img src={photoDraft} alt={t("settings.profileAvatarPhoto")} className="h-full w-full object-cover" /> : name.trim() ? getDisplayNameInitials(name) : <UserCircle className="h-10 w-10" aria-hidden="true" />}
          </div>
          <div className="min-w-0 space-y-2">
            <p className="font-semibold">{t("settings.profileAvatarPhoto")}</p>
            <p className="text-sm leading-6 text-muted-foreground">{t("settings.profileAvatarPhotoDescription")}</p>
            <input ref={fileInput} type="file" accept="image/*" className="sr-only" aria-label={t("settings.profileAvatarPhotoUpload")} disabled={processing} onChange={(event) => void upload(event)} />
            <div className="flex flex-wrap gap-2" aria-busy={processing}>
              <Button type="button" variant="outline" disabled={processing} onClick={() => fileInput.current?.click()}><Upload className="h-4 w-4" aria-hidden="true" />{processing ? t("settings.profileAvatarPhotoProcessing") : t("settings.profileAvatarPhotoUpload")}</Button>
              {isStoredProfileAvatarImage(photoDraft) ? <Button type="button" variant="ghost" disabled={processing} onClick={() => { photoDirty.current = true; setPhotoDraft(""); setPhotoError(null); setPhotoSaved(false); }}><Trash2 className="h-4 w-4" aria-hidden="true" />{t("settings.profileAvatarPhotoRemove")}</Button> : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2"><Button type="button" disabled={processing} onClick={savePhoto}>{language === "fa" ? "ذخیرهٔ عکس" : "Save photo"}</Button><Button type="button" variant="outline" onClick={cancelPhoto}>{language === "fa" ? "لغو تغییر عکس" : "Cancel photo changes"}</Button></div>
        {photoError ? <p role="alert" className="text-sm text-destructive">{t(photoError === "storage" ? "settings.localPersistenceError" : "settings.profileAvatarPhotoError")}</p> : null}
        {photoSaved ? <p role="status" className="text-sm text-muted-foreground">{t("common.changesSaved")}</p> : null}
      </section>
      <form onSubmit={saveName} className="max-w-xl space-y-4 border-t pt-6">
        <label className="block space-y-2"><span className="text-sm font-medium">{t("settings.displayName")}</span><Input value={draft} onChange={(event) => { nameDirty.current = true; setDraft(event.target.value); setNameSaved(false); setNameError(false); }} placeholder={t("settings.displayNamePlaceholder")} /></label>
        <div className="flex flex-wrap gap-2"><Button type="submit">{t("common.saveChanges")}</Button><Button type="button" variant="outline" onClick={() => { nameDirty.current = false; setDraft(name); setNameError(false); setNameSaved(false); }}>{t("common.cancel")}</Button></div>
        {nameError ? <p role="alert" className="text-sm text-destructive">{t("settings.localPersistenceError")}</p> : null}
        {nameSaved ? <p role="status" className="text-sm text-muted-foreground">{t("common.changesSaved")}</p> : null}
      </form>
    </CardContent>
  </Card>;
}
