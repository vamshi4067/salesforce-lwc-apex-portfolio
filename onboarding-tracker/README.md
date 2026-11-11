# Onboarding Tracker

A standalone customer-onboarding showcase. The public site uses open-source Lightning Web Components and fictional data held in the browser. An account manager completes required tasks, moves through Documents, Discovery, Configuration, Training, Review and Launch, sees overdue dates, and adds optional follow-ups. The public demo also supports editing customer details, notes, task owner and due date, blockers, and a session activity history. Open blockers prevent advancing. Reset restores the sample journey. The last stage is the end of the journey; it does not mark the whole onboarding as finished.

## Salesforce implementation

The separate `salesforce/force-app` package includes an Account record-page LWC, `OnboardingController` Apex and test class, and Account/Task custom fields. Apex checks the current stage and requires all required tasks to be completed before advancing. Follow-ups are standard Tasks related to the Account. The component displays progress and lets a user complete tasks, advance, and add follow-ups.

Deploy from the `salesforce` directory to an authenticated sandbox using Salesforce CLI, run `OnboardingControllerTest`, grant the user Account and Task access, field-level access to the included fields, and Apex class access, then add `onboardingTracker` to an Account Lightning record page. Populate `Onboarding_Stage__c` on the Account and add required Tasks for each stage. `scripts/seed.apex` creates a fictional sample account and tasks in a sandbox. This example assumes Task statuses `Not Started` and `Completed` and the `Normal` priority exist in the org. Adapt to configured values and permissions. Salesforce compilation, deployment, and Apex tests have not been verified in an authenticated org.

The additional customer detail, task editing, blocker and activity features are implemented in the browser demo only; they are not yet implemented in the Salesforce LWC or Apex. The Salesforce controller does not check blockers. The public browser demo does not connect to Salesforce and does not run Apex; it uses an in-memory JavaScript adapter. Its sample task dates are generated relative to the visitor's local day. Stage validation is implemented in the controller, not as an org-wide validation rule; direct edits or other automation can bypass it. The controller checks tasks visible to the running user, so configure access so each manager can see all required onboarding tasks; otherwise hidden tasks cannot be counted. Test sharing and field permissions in your org before use.

## Build and Netlify

Run `npm install`, `npm test`, and `npm run build`. Upload the `dist` folder to Netlify, or use `npm run build` and publish `dist` when connecting the project repository.
