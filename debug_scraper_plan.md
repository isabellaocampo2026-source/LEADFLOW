# Debug Plan

1. **Unblock CSS**: Finca Raíz might be detecting "headless" behavior or failing to render cards because CSS is blocked. Re-enable CSS download.
2. **Snapshot**: If 0 cards are found, take a screenshot (conceptual, or log HTML length) to see if we are on a CAPTCHA page or a 404.
3. **Log Selectors**: Log `await page.content()` length to check if we are getting data.
4. **Relax Selectors**: If specific classes fail, try a very generic `a` tag search to see if *anything* exists.
