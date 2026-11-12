import { LightningElement } from "lwc";
import {
  services,
  getDemoDays,
  getAvailability,
  getBookings,
  bookAppointment,
  cancelAppointment,
} from "c/workflowService";
export default class AppointmentBooking extends LightningElement {
  service = "repair";
  date = getDemoDays()[0].value;
  slotId = "";
  name = "Maya Patel";
  email = "maya@example.com";
  address = "24 Cedar Lane, Boston, MA";
  busy = false;
  error = "";
  bookings = getBookings();
  confirmation = null;
  revision = 0;
  get serviceOptions() {
    return services;
  }
  get days() {
    return getDemoDays().map((d) => ({
      ...d,
      className: d.value === this.date ? "day selected" : "day",
      pressed: d.value === this.date,
    }));
  }
  get chosenService() {
    return services.find((s) => s.id === this.service);
  }
  get dateLabel() {
    return getDemoDays().find((d) => d.value === this.date)?.full;
  }
  get slots() {
    this.revision;
    return getAvailability(this.service, this.date).map((s) => ({
      ...s,
      className: s.id === this.slotId ? "slot selected" : "slot",
      pressed: s.id === this.slotId,
      label: `${s.name}, ${s.time}`,
    }));
  }
  get availableCount() { return this.slots.length; }
  get confirmedCount() { return this.bookings.filter((b) => b.status === "Confirmed").length; }
  get cancelledCount() { return this.bookings.filter((b) => b.status === "Cancelled").length; }
  get noSlots() {
    return !this.slots.length;
  }
  get chosenSlot() {
    return this.slots.find((s) => s.id === this.slotId);
  }
  get selectionLabel() {
    return this.chosenSlot
      ? `${this.chosenSlot.name} · ${this.chosenSlot.time}`
      : "Select an available time";
  }
  get hasBookings() {
    return this.bookings.length > 0;
  }
  get bookingRows() {
    return this.bookings.map((b) => ({
      ...b,
      active: b.status === "Confirmed",
      className: b.status === "Confirmed" ? "badge" : "badge cancelled",
      dateText: getDemoDays().find((d) => d.value === b.date)?.label || b.date,
      cancelLabel: `Cancel appointment ${b.id}`,
    }));
  }
  get buttonLabel() {
    return this.busy ? "Booking appointment…" : "Confirm appointment";
  }
  renderedCallback() {
    const select = this.template.querySelector("select");
    if (select) select.value = this.service;
  }
  serviceChanged(e) {
    this.service = e.target.value;
    this.clearSelection();
  }
  dayChanged(e) {
    this.date = e.currentTarget.dataset.date;
    this.clearSelection();
  }
  clearSelection() {
    this.slotId = "";
    this.error = "";
    this.confirmation = null;
  }
  selectSlot(e) {
    if (this.busy) return;
    this.slotId = e.currentTarget.dataset.id;
    this.error = "";
    this.confirmation = null;
  }
  fieldChanged(e) {
    this[e.target.name] = e.target.value;
  }
  async book() {
    if (this.busy) return;
    this.error = "";
    if (
      ![...this.template.querySelectorAll("input")].reduce(
        (valid, field) => field.reportValidity() && valid,
        true,
      )
    )
      return;
    if (!this.slotId) {
      this.error = "Select an available time before confirming.";
      return;
    }
    this.busy = true;
    try {
      this.confirmation = await bookAppointment({
        service: this.service,
        date: this.date,
        slotId: this.slotId,
        name: this.name,
        email: this.email,
        address: this.address,
      });
      this.bookings = getBookings();
      this.slotId = "";
      this.revision++;
    } catch (e) {
      this.error = e.message;
      this.slotId = "";
      this.revision++;
    } finally {
      this.busy = false;
    }
  }
  async cancel(e) {
    if (this.busy) return;
    this.busy = true;
    this.error = "";
    try {
      this.bookings = await cancelAppointment(e.currentTarget.dataset.id);
      this.confirmation = null;
      this.revision++;
    } catch (err) {
      this.error = err.message;
    } finally {
      this.busy = false;
    }
  }
}
