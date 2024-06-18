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
        let cookieDetails = {
          url: `https://${cookie.domain}${cookie.path || "/"}`,
          name: cookie.name,
          value: cookie.value,
          secure: true, // Ensure cookies are set as secure
          httpOnly: cookie.httpOnly || false,
          sameSite: cookie.sameSite || "lax",
        };

        // Setting expiration date if available
        if (cookie.expirationDate) {
          cookieDetails.expirationDate = Math.floor(cookie.expirationDate);
        } else if (cookie.session) {
          delete cookieDetails.expirationDate;
        }

        console.log(
          `Attempting to set cookie: ${JSON.stringify(cookieDetails)}`
        );

        // Setting the cookie
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

    // Resolving all promises
    Promise.all(promises)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));

    return true; // Required to indicate async operation
  }
});
