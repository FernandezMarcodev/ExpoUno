/* global clients */
self.addEventListener("push", (event) => {
  let datos = { title: "Concierto Finder", body: "", url: "/" };
  if (event.data) {
    try {
      datos = { ...datos, ...event.data.json() };
    } catch {
      datos.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(datos.title, {
      body: datos.body,
      icon: "/logo.png",
      badge: "/logo.png",
      data: { url: datos.url },
      tag: "expouno-novedad",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
      for (const cliente of lista) {
        if ("focus" in cliente) {
          if ("navigate" in cliente) cliente.navigate(url);
          return cliente.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});