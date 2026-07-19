export type ServiceWorkerUpdateResult =
  | "unsupported"
  | "notRegistered"
  | "checked"
  | "failed";

type ServiceWorkerRegistrationLike = {
  update: () => Promise<unknown>;
};

type ServiceWorkerContainerLike = {
  getRegistration: () => Promise<ServiceWorkerRegistrationLike | undefined>;
};

export async function checkForServiceWorkerUpdate(
  serviceWorkerContainer: ServiceWorkerContainerLike | undefined =
    typeof navigator === "undefined" ? undefined : navigator.serviceWorker
): Promise<ServiceWorkerUpdateResult> {
  if (!serviceWorkerContainer) {
    return "unsupported";
  }

  try {
    const registration = await serviceWorkerContainer.getRegistration();

    if (!registration) {
      return "notRegistered";
    }

    await registration.update();
    return "checked";
  } catch {
    return "failed";
  }
}
