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
        // Construct cookie details
        let cookieDetails = {
          url: `https://${
            cookie.domain.startsWith(".")
              ? cookie.domain.substring(1)
              : cookie.domain
          }${cookie.path || "/"}`,
          name: cookie.name,
          value: cookie.value,
          secure: cookie.secure !== undefined ? cookie.secure : true, // Default to true if not specified
          httpOnly: cookie.httpOnly !== undefined ? cookie.httpOnly : false,
          sameSite: cookie.sameSite || "lax",
        };

        // Special handling for prefixes
        if (cookie.name.startsWith("__Host-")) {
          cookieDetails.secure = true;
          cookieDetails.path = "/";
          delete cookieDetails.domain;
        } else if (cookie.name.startsWith("__Secure-")) {
          cookieDetails.secure = true;
        }

        // Handle expiration date
        if (cookie.expirationDate) {
          cookieDetails.expirationDate = Math.floor(cookie.expirationDate);
        } else if (cookie.session) {
          delete cookieDetails.expirationDate;
        }

        console.log(
          `Attempting to set cookie: ${JSON.stringify(cookieDetails)}`
        );

        // Set the cookie
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

    // Resolve all promises
    Promise.all(promises)
      .then(() => {
        console.log("All cookies set successfully.");
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Error setting cookies:", error.message);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Required to indicate async operation
  }
});
