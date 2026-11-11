# Service Studio — Field-service appointment booking

An interactive field-service booking demo built with Lightning Web Components, with a separate Salesforce LWC and Apex implementation. A customer selects a service and date, sees available technicians, books a visit and can cancel it to release the slot.

## Run locally

Use Node 22 or newer:

```sh
npm ci
npm test
npm run build
python3 -m http.server 8080 --directory dist
```

The public demo uses fictional data held in memory. It does not connect to Salesforce or send emails. Reset reloads the sample data.

## Publish on Netlify

Set the repository base directory to `service-studio`, run `npm run build`, and publish `dist`. No Salesforce credentials are needed for the public demo.

## Salesforce sandbox

The `salesforce/force-app` folder contains the `fieldBookingStudio` LWC, `BookingStudioController` Apex class and tests, service-slot and booking objects, and a user permission set. From `salesforce/`, deploy to an authenticated sandbox, assign `Service_Studio_User`, run `BookingStudioControllerTest`, seed sample slots using `scripts/seed.apex`, and add `fieldBookingStudio` to a Lightning App or Home page.

This custom scheduling example is independent of the licensed Salesforce Field Service scheduling engine. The public browser demo simulates the service; Apex only runs in Salesforce. Deployment, Apex compilation, permissions, and test coverage must be verified in a sandbox. The example uses simplified shared sandbox data and is not a production scheduling system.

## Source

- `src/modules/c/appointmentBooking`: public booking LWC.
- `src/modules/c/workflowService`: in-memory availability, booking and cancellation logic.
- `salesforce/force-app`: platform LWC, Apex, metadata and tests.
- `tests/workflows.test.mjs`: booking, validation and conflict tests.
