import { LightningElement } from "lwc";
export default class App extends LightningElement {
  view = "quotes";
  source = "";
  sourceFile = "QuoteStudioController.cls";
  sourceLoading = false;
  sourceError = "";
  sourceSeq = 0;
  resetVersion = 0;
  files = [
    "QuoteStudioController.cls",
    "QuoteStudioControllerTest.cls",
    "BookingStudioController.cls",
    "BookingStudioControllerTest.cls",
    "quoteBuilder.js",
    "quoteBuilder.html",
    "appointmentBooking.js",
    "appointmentBooking.html",
    "workflowService.js",
    "salesQuoteStudio.js",
    "fieldBookingStudio.js",
  ];
  get quotesHidden() {
    return this.view !== "quotes";
  }
  get bookingHidden() {
    return this.view !== "booking";
  }
  get architectureHidden() {
    return this.view !== "architecture";
  }
  get sourceHidden() {
    return this.view !== "source";
  }
  get quoteClass() {
    return this.view === "quotes" ? "demo-tab active" : "demo-tab";
  }
  get bookingClass() {
    return this.view === "booking" ? "demo-tab active" : "demo-tab";
  }
  get quoteCurrent() {
    return this.view === "quotes" ? "page" : null;
  }
  get bookingCurrent() {
    return this.view === "booking" ? "page" : null;
  }
  get architectureClass() {
    return this.view === "architecture" ? "nav active" : "nav";
  }
  get sourceClass() {
    return this.view === "source" ? "nav active" : "nav";
  }
  get isQuote() {
    return this.view === "quotes";
  }
  get isBooking() {
    return this.view === "booking";
  }
  get isDemo() {
    return this.isQuote || this.isBooking;
  }
  get options() {
    return this.files.map((name) => ({ name }));
  }
  changeView(e) {
    this.view = e.currentTarget.dataset.view;
    if (this.view === "source") this.loadSource();
  }
  inspect() {
    this.sourceFile = this.isBooking
      ? "BookingStudioController.cls"
      : "QuoteStudioController.cls";
    this.view = "source";
    this.loadSource();
  }
  fileChanged(e) {
    this.sourceFile = e.target.value;
    this.loadSource();
  }
  renderedCallback() {
    const select = this.template.querySelector("select");
    if (select) select.value = this.sourceFile;
  }
  async loadSource() {
    const seq = ++this.sourceSeq;
    this.sourceLoading = true;
    this.sourceError = "";
    try {
      const response = await fetch("/source/" + this.sourceFile);
      if (!response.ok)
        throw new Error(
          "Source could not be loaded. Download the project to inspect it.",
        );
      const text = await response.text();
      if (seq === this.sourceSeq) this.source = text;
    } catch (e) {
      if (seq === this.sourceSeq) {
        this.source = "";
        this.sourceError = e.message;
      }
    } finally {
      if (seq === this.sourceSeq) this.sourceLoading = false;
    }
  }
  reset() {
    window.location.reload();
  }
}
