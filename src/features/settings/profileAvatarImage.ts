const PROFILE_AVATAR_IMAGE_SIZE = 160;

export function isStoredProfileAvatarImage(value: string): boolean {
  return value.startsWith("data:image/");
}

export function resizeProfileAvatarImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Unsupported avatar image type"));
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = PROFILE_AVATAR_IMAGE_SIZE;
        canvas.height = PROFILE_AVATAR_IMAGE_SIZE;

        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Avatar canvas context unavailable");
        }

        const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
        const sourceX = Math.max(0, (image.naturalWidth - sourceSize) / 2);
        const sourceY = Math.max(0, (image.naturalHeight - sourceSize) / 2);

        context.drawImage(
          image,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          0,
          0,
          PROFILE_AVATAR_IMAGE_SIZE,
          PROFILE_AVATAR_IMAGE_SIZE
        );

        const webpDataUrl = canvas.toDataURL("image/webp", 0.78);
        resolve(
          webpDataUrl.startsWith("data:image/webp")
            ? webpDataUrl
            : canvas.toDataURL("image/jpeg", 0.82)
        );
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Avatar image could not be loaded"));
    };

    image.src = objectUrl;
  });
}
