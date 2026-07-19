(() => {
  const localDevelopmentHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

  if (
    localDevelopmentHosts.has(window.location.hostname) ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  window.addEventListener("load", () => {
    const serviceWorkerUrl = new URL("service-worker.js", document.baseURI);
    const scope = new URL("./", serviceWorkerUrl).pathname;

    void navigator.serviceWorker.register(serviceWorkerUrl, { scope });
  });
})();
