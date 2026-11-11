import { LightningElement } from "lwc";
import submit from "@salesforce/apex/QuoteStudioController.submit";
import review from "@salesforce/apex/QuoteStudioController.review";
export default class SalesQuoteStudio extends LightningElement {
  quantities = { "heat-pump": 2, thermostat: 2, install: 1, care: 0 };
  discount = 15;
  reason = "Two properties in the same installation rollout.";
  note = "Volume pricing reviewed.";
  quote;
  busy = false;
  error = "";
  get locked() {
    return this.busy || Boolean(this.quote);
  }
  get pending() {
    return this.quote?.Status__c === "Pending approval";
  }
  get products() {
    return [
      { id: "heat-pump", name: "Air-source heat pump ($4,200)" },
      { id: "thermostat", name: "Smart thermostat ($240)" },
      { id: "install", name: "Installation ($800)" },
      { id: "care", name: "Annual care plan ($360)" },
    ].map((p) => ({ ...p, quantity: this.quantities[p.id] }));
  }
  quantityChanged(e) {
    this.quantities = {
      ...this.quantities,
      [e.target.dataset.id]: Number(e.detail.value),
    };
  }
  discountChanged(e) {
    this.discount = Number(e.detail.value);
  }
  reasonChanged(e) {
    this.reason = e.detail.value;
  }
  noteChanged(e) {
    this.note = e.detail.value;
  }
  valid() {
    return [
      ...this.template.querySelectorAll("lightning-input,lightning-textarea"),
    ].reduce((valid, input) => input.reportValidity() && valid, true);
  }
  async save() {
    if (this.locked || !this.valid()) return;
    this.busy = true;
    this.error = "";
    try {
      const lines = Object.entries(this.quantities)
        .filter(([, quantity]) => quantity !== 0)
        .map(([productId, quantity]) => ({ productId, quantity }));
      this.quote = await submit({
        linesJson: JSON.stringify(lines),
        discount: this.discount,
        reason: this.reason,
      });
    } catch (e) {
      this.error = e.body?.message || e.message;
    } finally {
      this.busy = false;
    }
  }
  async decide(e) {
    if (this.busy) return;
    this.busy = true;
    this.error = "";
    try {
      this.quote = await review({
        quoteId: this.quote.Id,
        decision: e.currentTarget.dataset.decision,
        note: this.note,
      });
    } catch (err) {
      this.error = err.body?.message || err.message;
    } finally {
      this.busy = false;
    }
  }
  restart() {
    if (!this.busy) {
      this.quote = null;
      this.error = "";
    }
  }
}
