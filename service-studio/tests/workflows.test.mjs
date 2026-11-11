import test from "node:test";
import assert from "node:assert/strict";
import * as service from "../src/modules/c/workflowService/workflowService.js";

const lines = [
  { productId: "heat-pump", quantity: 2 },
  { productId: "install", quantity: 1 },
];
test("quote totals use catalog prices and cent rounding", () => {
  assert.equal(
    typeof service.priceQuote,
    "function",
    "quote pricing must exist",
  );
  assert.deepEqual(service.priceQuote(lines, 10), {
    subtotal: 920000,
    saving: 92000,
    total: 828000,
    route: "Approved",
  });
});
test("discount boundary and malformed quantities cannot bypass approval", () => {
  assert.equal(service.priceQuote(lines, 10.01).route, "Pending approval");
  for (const discount of [-1, 30.01, NaN, Infinity])
    assert.throws(() => service.priceQuote(lines, discount));
  for (const quantity of [0, -1, 1.5, NaN, 101])
    assert.throws(() =>
      service.priceQuote([{ productId: "install", quantity }], 0),
    );
  assert.throws(() => service.priceQuote([], 0));
  assert.throws(() =>
    service.priceQuote([{ productId: "unknown", quantity: 1 }], 0),
  );
});
test("approval requires a reason, locks submitted pricing and prevents repeat decisions", async () => {
  service.resetWorkflows();
  await assert.rejects(
    service.submitQuote({ lines, discount: 15, reason: "" }),
  );
  const quote = await service.submitQuote({
    lines,
    discount: 15,
    reason: "Three sites in one rollout.",
  });
  assert.equal(quote.status, "Pending approval");
  lines[0].quantity = 3;
  assert.equal(service.getQuote().lines[0].quantity, 2);
  lines[0].quantity = 2;
  await assert.rejects(service.reviewQuote("Approved", ""));
  const result = await service.reviewQuote(
    "Approved",
    "Volume discount reviewed.",
  );
  assert.equal(result.status, "Approved");
  assert.equal(result.total, 782000);
  await assert.rejects(service.reviewQuote("Rejected", "Too late"));
  await assert.rejects(service.submitQuote({ lines, discount: 5, reason: "" }));
});
test("low discounts approve immediately and reset permits a fresh draft", async () => {
  service.resetWorkflows();
  assert.equal(
    (await service.submitQuote({ lines, discount: 10, reason: "" })).status,
    "Approved",
  );
  service.newQuote();
  assert.equal(service.getQuote(), null);
  const q = await service.submitQuote({
    lines,
    discount: 20,
    reason: "Competitive bid.",
  });
  assert.equal(q.status, "Pending approval");
  assert.equal(
    (await service.reviewQuote("Rejected", "Margin too low.")).status,
    "Rejected",
  );
});
test("adapter enforces note lengths even when callers bypass form controls", async () => {
  service.resetWorkflows();
  await assert.rejects(
    service.submitQuote({ lines, discount: 15, reason: "x".repeat(501) }),
  );
  await service.submitQuote({
    lines,
    discount: 15,
    reason: "Two properties in one rollout.",
  });
  await assert.rejects(service.reviewQuote("Approved", "x".repeat(501)));
});
test("availability filters technician skills and rejects invalid dates", () => {
  service.resetWorkflows();
  const date = service.getDemoDays()[0].value;
  const slots = service.getAvailability("repair", date);
  assert.ok(slots.length > 0);
  assert.ok(slots.every((s) => s.skills.includes("repair")));
  assert.throws(() => service.getAvailability("unknown", date));
  assert.throws(() => service.getAvailability("repair", "2020-01-01"));
});
test("booking validates contact, prevents concurrent conflicts and cancellation releases slot", async () => {
  service.resetWorkflows();
  const date = service.getDemoDays()[0].value;
  const slot = service.getAvailability("repair", date)[0];
  const request = {
    service: "repair",
    date,
    slotId: slot.id,
    name: "Maya Patel",
    email: "maya@example.com",
    address: "24 Cedar Lane, Boston",
  };
  await assert.rejects(service.bookAppointment({ ...request, email: "bad" }));
  await assert.rejects(service.bookAppointment({ ...request, address: " " }));
  await assert.rejects(
    service.bookAppointment({ ...request, slotId: "missing" }),
  );
  const results = await Promise.allSettled([
    service.bookAppointment(request),
    service.bookAppointment(request),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const booking = results.find((r) => r.status === "fulfilled").value;
  assert.equal(booking.name, "Maya Patel");
  assert.ok(
    !service.getAvailability("repair", date).some((s) => s.id === slot.id),
  );
  await service.cancelAppointment(booking.id);
  assert.ok(
    service.getAvailability("repair", date).some((s) => s.id === slot.id),
  );
  await assert.rejects(service.cancelAppointment(booking.id));
});
