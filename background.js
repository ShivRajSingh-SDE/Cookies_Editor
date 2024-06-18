chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCookies") {
    chrome.cookies.getAll({ domain: request.domain }, (cookies) => {
      sendResponse({ success: true, cookies: cookies });
    });
    return true; // Required to indicate async operation
  }

  if (request.action === "setCookies") {
    const cookies = request.cookies;

    const promises = cookies.map((cookie) => {
      return new Promise((resolve, reject) => {
        const cookieDetails = {
          url: `https://${cookie.domain}${cookie.path || "/"}`,
          name: cookie.name,
          value: cookie.value,
          path: cookie.path || "/",
          secure: cookie.secure || false,
          httpOnly: cookie.httpOnly || false,
          sameSite: cookie.sameSite || "unspecified",
        };

        // If the cookie has the __Host- prefix, set additional attributes
        if (cookie.name.startsWith("__Host-")) {
          cookieDetails.secure = true;
          cookieDetails.path = "/";
          delete cookieDetails.domain;
        }

        if (cookie.expirationDate) {
          cookieDetails.expirationDate = Math.floor(cookie.expirationDate);
        }

        chrome.cookies.set(cookieDetails, (result) => {
          if (result) {
            console.log(`Set cookie: ${cookie.name}`);
            resolve();
          } else {
            const error = chrome.runtime.lastError
              ? chrome.runtime.lastError.message
              : "Unknown error";
            console.error(`Failed to set cookie: ${cookie.name}`, error);
            reject(
              new Error(`Failed to set cookie: ${cookie.name} - ${error}`)
            );
          }
        });
      });
    });

    Promise.all(promises)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));

    return true; // Required to indicate async operation
  }
});
