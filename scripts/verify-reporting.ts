import { prisma } from "../src/lib/prisma";
import { getReportOptions, getReportStats } from "../src/lib/reporting";

async function main() {
  const all = await getReportStats();
  const options = await getReportOptions();

  if (all.registeredChildren === 0) {
    console.log("Reporting query check passed: no child records are currently available.");
    return;
  }

  if (options.villages[0]) {
    const village = await getReportStats({ village: options.villages[0] });
    if (village.registeredChildren > all.registeredChildren) {
      throw new Error("Village filter returned more children than the unfiltered query.");
    }
  }

  if (options.chws[0]) {
    const chw = await getReportStats({ chwId: options.chws[0].id });
    if (chw.registeredChildren > all.registeredChildren) {
      throw new Error("CHW filter returned more children than the unfiltered query.");
    }
  }

  const dated = await getReportStats({ from: "2000-01-01", to: "2100-12-31" });
  if (dated.registeredChildren !== all.registeredChildren) {
    throw new Error("Inclusive date range did not preserve all existing child records.");
  }

  console.log(`Reporting query checks passed for ${all.registeredChildren} child record(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
