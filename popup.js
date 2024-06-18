document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("addCookies").addEventListener("click", () => {
    const cookieInput = document.getElementById("cookieInput").value;
    let cookies;
    try {
      cookies = JSON.parse(cookieInput);
    } catch (e) {
      alert("Invalid JSON");
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      const url = new URL(activeTab.url);

      chrome.runtime.sendMessage(
        { action: "setCookies", cookies: cookies },
        (response) => {
          const status = document.getElementById("status");
          if (response.success) {
            status.textContent = "Cookies added successfully";
          } else {
            status.textContent = "Failed to add cookies: " + response.error;
          }
        }
      );
    });
  });

  document.getElementById("getCookies").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      const url = new URL(activeTab.url);
      chrome.runtime.sendMessage(
        { action: "getCookies", domain: url.hostname },
        (response) => {
          const status = document.getElementById("status");
          if (response.success) {
            document.getElementById("cookieInput").value = JSON.stringify(
              response.cookies,
              null,
              2
            );
          } else {
            status.textContent = "Failed to get cookies: " + response.error;
          }
        }
      );
    });
  });
});
