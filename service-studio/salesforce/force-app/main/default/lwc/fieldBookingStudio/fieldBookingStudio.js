import { LightningElement } from "lwc";
import getSlots from "@salesforce/apex/BookingStudioController.getSlots";
import book from "@salesforce/apex/BookingStudioController.book";
import cancel from "@salesforce/apex/BookingStudioController.cancel";
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export default class FieldBookingStudio extends LightningElement {
  service = "repair";
  day = tomorrow();
  slots = [];
  slotId = "";
  customer = "Maya Patel";
  email = "maya@example.com";
  address = "24 Cedar Lane, Boston";
  busy = false;
  error = "";
  bookings = [];
  options = [
    { label: "Heating repair", value: "repair" },
    { label: "Installation survey", value: "install" },
    { label: "Annual maintenance", value: "maintenance" },
  ];
  get bookingRows() {
    return this.bookings.map((booking) => ({
      ...booking,
      active: booking.Status__c === "Confirmed",
    }));
  }
  get noSlots() {
    return this.slots.length === 0 && !this.busy;
  }
  get slotRows() {
    return this.slots.map((s) => ({
      ...s,
      selected: s.Id === this.slotId,
      label: s.Id === this.slotId ? "Selected" : "Select time",
    }));
  }
  connectedCallback() {
    this.refresh();
  }
  fieldChanged(e) {
    this[e.target.name] = e.detail.value;
  }
  filterChanged(e) {
    this[e.target.name] = e.detail.value;
    this.slotId = "";
    this.refresh();
  }
  async refresh() {
    this.busy = true;
    this.error = "";
    try {
      this.slots = await getSlots({ service: this.service, day: this.day });
    } catch (e) {
      this.slots = [];
      this.error = e.body?.message || e.message;
    } finally {
      this.busy = false;
    }
  }
  selectSlot(e) {
    this.slotId = e.currentTarget.dataset.id;
    this.error = "";
  }
  async confirm() {
    if (this.busy) return;
    if (
      ![...this.template.querySelectorAll("lightning-input")].reduce(
        (valid, input) => input.reportValidity() && valid,
        true,
      )
    )
      return;
    if (!this.slotId) {
      this.error = "Select a time.";
      return;
    }
    this.busy = true;
    this.error = "";
    try {
      const booking = await book({
        slotId: this.slotId,
        service: this.service,
        customer: this.customer,
        email: this.email,
        address: this.address,
      });
      this.bookings = [...this.bookings, booking];
      this.slotId = "";
      await this.refresh();
    } catch (e) {
      this.error = e.body?.message || e.message;
    } finally {
      this.busy = false;
    }
  }
  async cancelBooking(e) {
    if (this.busy) return;
    const bookingId = e.currentTarget.dataset.id;
    this.busy = true;
    this.error = "";
    try {
      await cancel({ bookingId });
      this.bookings = this.bookings.map((booking) =>
        booking.Id === bookingId
          ? { ...booking, Status__c: "Cancelled" }
          : booking,
      );
      await this.refresh();
    } catch (e) {
      this.error = e.body?.message || e.message;
    } finally {
      this.busy = false;
    }
  }
}
