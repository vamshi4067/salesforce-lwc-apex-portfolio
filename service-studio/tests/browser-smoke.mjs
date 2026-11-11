import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const screenshotDir = resolve(process.env.SCREENSHOT_DIR || "verification");
await mkdir(screenshotDir, { recursive: true });
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:8080";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.CHROMIUM_EXECUTABLE }
    : {}),
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const response = await page.goto(baseUrl);
assert.equal(response.status(), 200);
await page.getByRole("heading", { name: "Build the right deal." }).waitFor();
assert.equal(
  await page.getByLabel("Why this discount?").inputValue(),
  "Two properties in the same installation rollout.",
);
console.log(
  "Initial textareas:",
  await page
    .locator("textarea:visible")
    .evaluateAll((nodes) =>
      nodes.map((n) => ({ value: n.value, text: n.textContent })),
    ),
);
await page.screenshot({
  path: resolve(screenshotDir, "desktop.png"),
  fullPage: true,
});
assert.equal(await page.locator(".grand-total dd").innerText(), "$8,228.00");
await page
  .getByLabel("Quantity for Air-source heat pump", { exact: true })
  .fill("3");
await page
  .getByLabel("Quantity for Air-source heat pump", { exact: true })
  .blur();
assert.equal(await page.locator(".grand-total dd").innerText(), "$11,798.00");
await page
  .getByLabel("Quantity for Air-source heat pump", { exact: true })
  .fill("2");
await page
  .getByLabel("Quantity for Air-source heat pump", { exact: true })
  .blur();
await page.getByRole("button", { name: "Add line item", exact: true }).click();
assert.equal(await page.locator(".grand-total dd").innerText(), "$8,534.00");
await page
  .getByRole("button", { name: "Remove Annual care plan", exact: true })
  .click();
assert.equal(await page.locator(".grand-total dd").innerText(), "$8,228.00");
await page.getByRole("button", { name: "Request discount approval" }).click();
await page.getByRole("heading", { name: "Review as sales manager" }).waitFor();
await page.getByRole("button", { name: "Approve", exact: true }).click();
await page.locator(".status.approved").waitFor();
assert.equal(await page.getByLabel("Project discount").isDisabled(), true);
await page.getByRole("button", { name: "Start a new draft" }).click();
await page.getByLabel("Project discount").fill("10");
await page.getByLabel("Project discount").blur();
await page.getByRole("button", { name: "Submit & auto-approve" }).click();
await page.locator(".status.approved").waitFor();
await page.getByRole("button", { name: "Start a new draft" }).click();
await page.getByLabel("Project discount").fill("10.01");
await page.getByLabel("Project discount").blur();
await page.getByRole("button", { name: "Request discount approval" }).click();
await page.getByRole("heading", { name: "Review as sales manager" }).waitFor();
await page.getByLabel("Decision note").fill("Margin is too low.");
await page.getByRole("button", { name: "Reject", exact: true }).click();
await page.locator(".status.rejected").waitFor();
console.log("Quote submit, approval boundary, lock and rejection: passed");
await page
  .getByRole("button", { name: "Field-service booking", exact: true })
  .click();
await page
  .getByRole("button", { name: "Confirm appointment", exact: true })
  .click();
await page
  .getByRole("alert")
  .filter({ hasText: "Select an available time" })
  .waitFor();
const first = page.locator(".slot:visible").first();
const slotLabel = await first.getAttribute("aria-label");
await first.click();
await page
  .getByRole("button", { name: "Confirm appointment", exact: true })
  .click();
await page
  .getByRole("heading", { name: "You’re booked, Maya Patel." })
  .waitFor();
assert.equal(
  await page.getByRole("button", { name: slotLabel, exact: true }).count(),
  0,
);
await page.getByRole("button", { name: /Cancel appointment APT-/ }).click();
await page.getByText("Cancelled", { exact: true }).waitFor();
assert.equal(
  await page.getByRole("button", { name: slotLabel, exact: true }).count(),
  1,
);
await page.getByLabel("What does the customer need?").selectOption("install");
assert.equal(
  await page
    .locator(".slot:visible")
    .filter({ hasText: "Alex Morgan" })
    .count(),
  0,
);
await page.screenshot({
  path: resolve(screenshotDir, "booking.png"),
  fullPage: true,
});
console.log(
  "Booking validation, skill filtering, reservation, cancellation: passed",
);
await page
  .getByRole("button", { name: "Quote & discount approval", exact: true })
  .click();
await page.locator(".status.rejected").waitFor();
await page.getByRole("button", { name: "How it works", exact: true }).click();
await page
  .getByRole("heading", { name: "Follow the work, from click to record." })
  .waitFor();
await page.getByRole("button", { name: "Source code", exact: true }).click();
await page
  .getByLabel("Project source code")
  .getByText("public with sharing class QuoteStudioController", {
    exact: false,
  })
  .waitFor();
await page
  .getByLabel("Project file")
  .selectOption("BookingStudioController.cls");
await page
  .getByLabel("Project source code")
  .filter({ hasText: "public with sharing class BookingStudioController" })
  .waitFor();
const zip = await page.request.get(baseUrl + "/service-studio-source.zip");
assert.equal(zip.status(), 200);
assert.ok((await zip.body()).length > 20000);
console.log("Navigation preservation, architecture, source, download: passed");
await page
  .getByRole("button", { name: "Quote & discount approval", exact: true })
  .click();
for (const width of [390, 768, 1280]) {
  await page.setViewportSize({ width, height: 1000 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    `page overflow at ${width}`,
  );
  if (width === 390)
    await page.screenshot({
      path: resolve(screenshotDir, "mobile.png"),
      fullPage: true,
    });
  await page
    .getByRole("button", { name: "Field-service booking", exact: true })
    .click();
  if (width === 390)
    await page.screenshot({
      path: resolve(screenshotDir, "booking-mobile.png"),
      fullPage: true,
    });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    `booking overflow at ${width}`,
  );
  await page
    .getByRole("button", { name: "Quote & discount approval", exact: true })
    .click();
}
assert.deepEqual(errors, []);
console.log("Responsive widths 390/768/1280 and browser errors: passed");
await browser.close();
