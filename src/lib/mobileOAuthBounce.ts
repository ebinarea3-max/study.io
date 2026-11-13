/**
 * Helper to generate a client-side fallback HTML page that bounces
 * an external mobile browser back into the native Capacitor Android app
 * via the custom deep link scheme (com.studyio.app://auth?code=...).
 */
export function getMobileOAuthBounceHtml(deepLinkUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Returning to study.io...</title>
  <meta http-equiv="refresh" content="0;url=${deepLinkUrl}">
  <style>
    body {
      background: #08090c;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
      text-align: center;
      user-select: none;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #34D399;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 24px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #ffffff;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      margin: 0 0 24px 0;
      max-width: 320px;
      line-height: 1.5;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 14px 28px;
      background: #ffffff;
      color: #000000;
      font-weight: 600;
      font-size: 14px;
      border-radius: 9999px;
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
      cursor: pointer;
      transition: transform 0.15s ease;
    }
    .btn:active {
      transform: scale(0.98);
    }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <h1>Returning to study.io</h1>
  <p>Launching the app to complete your sign-in...</p>
  <a class="btn" href="${deepLinkUrl}" id="launchBtn">Open study.io</a>

  <script>
    (function() {
      var target = ${JSON.stringify(deepLinkUrl)};
      try {
        window.location.replace(target);
      } catch (e) {
        window.location.href = target;
      }
      setTimeout(function() {
        try {
          window.location.href = target;
        } catch (e) {}
      }, 300);
    })();
  </script>
</body>
</html>`;
}
