# Support Desk: Case Management

A separate Salesforce case-management showcase. The public site is built with open-source Lightning Web Components and sample data kept in memory. Select a case, search by case number, subject, customer or company, filter by priority and status, change its status and priority, and add an internal note. A resolution note is required when closing a case, and a closed case can be reopened. Reset restores sample cases. The browser does not execute Apex or connect to Salesforce.

## Salesforce implementation

`salesforce/force-app` contains an independent Salesforce LWC, `caseWorkspace`, and the `CaseDeskController` Apex class plus tests. The controller uses the standard Case object, sharing, user-mode reads and writes, and validates input. Internal notes and escalation reasons use non-public Case Comments, subject to the org’s sharing and access settings. Apex also includes methods to create a case, assign a user or queue, schedule follow-up, and escalate. The Salesforce LWC exposes these controller actions using a user or queue ID for assignment; the public demo also shows a sample activity timeline. Enable Case Field History Tracking in the org to maintain a durable status and ownership audit trail.

Deploy from the `salesforce` directory with Salesforce CLI to an authenticated sandbox, then run `CaseDeskControllerTest` and add `caseWorkspace` to a Lightning App or Home page. The org user needs Case and Case Comment access, field access to Follow_Up_Date__c, assignment permissions and access to the Apex class. The sample assumes the org offers the standard `New`, `Working`, `Closed` status and `High`, `Medium`, `Low` priority values and a `Web` origin; adjust for the org's configured picklists. Deployment, permissions and test execution have not been verified in an org.

## Local development and Netlify

Run `npm install`, `npm test`, and `npm run build`. Deploy the generated `dist` directory to Netlify, or connect this directory as the repository base with build command `npm run build` and publish directory `dist`.
