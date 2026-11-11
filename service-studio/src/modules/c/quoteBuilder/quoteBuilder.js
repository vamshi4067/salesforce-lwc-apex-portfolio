import { LightningElement } from "lwc";
import {
  catalog,
  money,
  priceQuote,
  getQuote,
  submitQuote,
  reviewQuote,
  newQuote,
} from "c/workflowService";
export default class QuoteBuilder extends LightningElement {
  items = [
    { productId: "heat-pump", quantity: 2 },
    { productId: "thermostat", quantity: 2 },
    { productId: "install", quantity: 1 },
  ];
  discount = 15;
  reason = "Two properties in the same installation rollout.";
  note = "Volume pricing is within the project margin.";
  quote = getQuote();
  error = "";
  busy = false;
  addId = "care";
  get rows() {
    return this.items.map((line) => {
      const p = catalog.find((p) => p.id === line.productId);
      return {
        ...line,
        ...p,
        unit: money(p.price),
        amount: money(p.price * line.quantity),
        label: `Quantity for ${p.name}`,
        removeLabel: `Remove ${p.name}`,
      };
    });
  }
  get totals() {
    try {
      return priceQuote(this.items, Number(this.discount));
    } catch {
      return { subtotal: 0, saving: 0, total: 0 };
    }
  }
  get subtotal() {
    return money(this.totals.subtotal);
  }
  get saving() {
    return money(this.totals.saving);
  }
  get total() {
    return money(this.totals.total);
  }
  get requiresApproval() {
    return Number(this.discount) > 10;
  }
  get locked() {
    return Boolean(this.quote) || this.busy;
  }
  get submitted() {
    return Boolean(this.quote);
  }
  get pending() {
    return this.quote?.status === "Pending approval";
  }
  get approved() {
    return this.quote?.status === "Approved";
  }
  get status() {
    return this.quote?.status || "Draft";
  }
  get statusClass() {
    return `status ${this.approved ? "approved" : this.quote?.status === "Rejected" ? "rejected" : this.pending ? "pending" : ""}`;
  }
  get reference() {
    return this.quote?.id || "New quote";
  }
  get actionLabel() {
    return this.busy
      ? "Saving quote…"
      : this.requiresApproval
        ? "Request discount approval"
        : "Submit & auto-approve";
  }
  get remainingProducts() {
    return catalog
      .filter((p) => !this.items.some((l) => l.productId === p.id))
      .map((p) => ({ ...p, label: `${p.name} · ${money(p.price)}` }));
  }
  get canAdd() {
    return this.remainingProducts.length > 0 && !this.submitted;
  }
  get events() {
    return (this.quote?.events || []).map((e, i) => ({ ...e, id: i }));
  }
  connectedCallback() {
    if (this.quote) {
      this.items = this.quote.lines;
      this.discount = this.quote.discount;
      this.reason = this.quote.reason;
    }
  }
  renderedCallback() {
    for (const field of this.template.querySelectorAll(
      "textarea[data-field]",
    )) {
      const value = this[field.dataset.field];
      if (field.value !== value) field.value = value;
    }
    const select = this.template.querySelector("select");
    if (select && !this.remainingProducts.some((p) => p.id === this.addId)) {
      this.addId = this.remainingProducts[0]?.id;
      select.value = this.addId;
    }
  }
  quantityChanged(e) {
    this.items = this.items.map((l) =>
      l.productId === e.target.dataset.id
        ? { ...l, quantity: Number(e.target.value) }
        : l,
    );
    this.error = "";
  }
  discountChanged(e) {
    this.discount = e.target.value;
    this.error = "";
  }
  reasonChanged(e) {
    this.reason = e.target.value;
  }
  noteChanged(e) {
    this.note = e.target.value;
  }
  productChanged(e) {
    this.addId = e.target.value;
  }
  add() {
    if (this.locked) return;
    const id = this.remainingProducts.some((p) => p.id === this.addId)
      ? this.addId
      : this.remainingProducts[0]?.id;
    if (id) this.items = [...this.items, { productId: id, quantity: 1 }];
  }
  remove(e) {
    if (!this.locked)
      this.items = this.items.filter(
        (l) => l.productId !== e.currentTarget.dataset.id,
      );
  }
  async submit() {
    if (this.locked) return;
    this.error = "";
    const fields = [...this.template.querySelectorAll("input,textarea")];
    if (!fields.reduce((valid, field) => field.reportValidity() && valid, true))
      return;
    this.busy = true;
    try {
      this.quote = await submitQuote({
        lines: this.items,
        discount: Number(this.discount),
        reason: this.reason,
      });
    } catch (e) {
      this.error = e.message;
    } finally {
      this.busy = false;
    }
  }
  async decide(e) {
    if (this.busy) return;
    this.busy = true;
    this.error = "";
    try {
      this.quote = await reviewQuote(
        e.currentTarget.dataset.decision,
        this.note,
      );
    } catch (err) {
      this.error = err.message;
    } finally {
      this.busy = false;
    }
  }
  restart() {
    if (this.busy) return;
    newQuote();
    this.quote = null;
    this.error = "";
  }
}
