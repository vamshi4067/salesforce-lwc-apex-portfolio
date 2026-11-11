import { mkdir, cp, copyFile, rm } from "node:fs/promises";
// Only the generated build directory is replaced; source is preserved.
await rm("dist", { recursive: true, force: true });
await mkdir("dist/assets", { recursive: true });
await cp("public", "dist", { recursive: true });
await mkdir("dist/source", { recursive: true });
for (const [dir, files] of Object.entries({
  quoteBuilder: ["js", "html"],
  appointmentBooking: ["js", "html"],
  workflowService: ["js"],
})) {
  for (const ext of files)
    await copyFile(
      `src/modules/c/${dir}/${dir}.${ext}`,
      `dist/source/${dir}.${ext}`,
    );
}
for (const name of [
  "QuoteStudioController",
  "QuoteStudioControllerTest",
  "BookingStudioController",
  "BookingStudioControllerTest",
])
  await copyFile(
    `salesforce/force-app/main/default/classes/${name}.cls`,
    `dist/source/${name}.cls`,
  );
for (const name of ["salesQuoteStudio", "fieldBookingStudio"])
  await copyFile(
    `salesforce/force-app/main/default/lwc/${name}/${name}.js`,
    `dist/source/${name}.js`,
  );
