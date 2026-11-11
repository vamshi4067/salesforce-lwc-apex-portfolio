import test from "node:test";
import assert from "node:assert/strict";
import * as service from "../src/modules/c/workflowService/workflowService.js";

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
