import { readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Offline fixture preparation only. Never import application code or access storage.
const DAY_MS = 86_400_000;
const fixtureDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(fixtureDirectory, "../../../..");
const [referenceDate, outputArgument, ...extraArguments] = process.argv.slice(2);
if (!referenceDate || !outputArgument || extraArguments.length > 0) {
  throw new Error("Usage: node rebase.mjs YYYY-MM-DD <new-output-file-outside-repository.json>");
}

const targetDay = Date.parse(referenceDate + "T00:00:00.000Z");
if (
  !/^\d{4}-\d{2}-\d{2}$/.test(referenceDate) ||
  !Number.isFinite(targetDay) ||
  new Date(targetDay).toISOString().slice(0, 10) !== referenceDate
) {
  throw new Error("Use an actual Gregorian reference date in YYYY-MM-DD format.");
}

const outputPath = resolve(outputArgument);
const relativeOutput = relative(repositoryRoot, outputPath);
if (
  !outputPath.toLowerCase().endsWith(".json") ||
  relativeOutput === "" ||
  (!relativeOutput.startsWith(".." + sep) && !isAbsolute(relativeOutput))
) {
  throw new Error("The output must be a new JSON file outside this repository.");
}

const source = JSON.parse(
  await readFile(new URL("./backup-v1.json", import.meta.url), "utf8")
);
const sourceDay = Date.parse(source.exportedAt.slice(0, 10) + "T00:00:00.000Z");
const delta = targetDay - sourceDay;

function shiftDates(value, milliseconds) {
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(Date.parse(value + "T00:00:00.000Z") + milliseconds)
        .toISOString().slice(0, 10);
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
      return new Date(Date.parse(value) + milliseconds).toISOString();
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => shiftDates(item, milliseconds));
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, shiftDates(item, milliseconds)])
    );
  }
  return value;
}

function monday(day) {
  return day - ((new Date(day).getUTCDay() + 6) % 7) * DAY_MS;
}

const rebased = shiftDates(source, delta);
// Week keys remain Mondays; preserve plan timestamps relative to their own week.
const weekDelta = monday(targetDay) - monday(sourceDay);
rebased.data.weeklyPlans = source.data.weeklyPlans.map((plan) => shiftDates(plan, weekDelta));
// This one obligation models a monthly day rather than a date-only deadline.
const monthlyObligation = rebased.data.financeObligations.find(
  (item) => item.id === "visual-qa-v1-obligation-004"
);
monthlyObligation.dueDay = new Date(targetDay + 4 * DAY_MS).getUTCDate();

// Exclusive creation prevents overwriting an existing backup or any source file.
await writeFile(outputPath, JSON.stringify(rebased, null, 2) + "\n", {
  encoding: "utf8",
  flag: "wx",
});
process.stdout.write("Created local fixture for " + referenceDate + ": " + outputPath + "\n");
