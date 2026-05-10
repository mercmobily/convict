import { test, expect } from "@playwright/test";
import { devLoginAs, withUserFixture } from "./support/convictTestSupport.js";

const DEV_USER_EMAIL = "slice1-playwright@convict.local";
const USERNAME = "slice1-playwright";
const DISPLAY_NAME = "Slice 1 Playwright";
const STARTS_ON = "2026-05-06";

async function ensureProgramSelectionFixture({ email, username, displayName }) {
  await withUserFixture({
    email,
    username,
    displayName
  });
}

async function readProgramSelectionState(page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/program-assignment", {
      credentials: "include"
    });
    if (!response.ok) {
      throw new Error(`Unable to read program selection state: ${response.status}`);
    }
    return response.json();
  });
}

async function postProgramStart(page, payload) {
  return page.evaluate(async (body) => {
    const sessionResponse = await fetch("/api/session", {
      credentials: "include"
    });
    if (!sessionResponse.ok) {
      throw new Error(`Unable to read session: ${sessionResponse.status}`);
    }
    const session = await sessionResponse.json();
    const response = await fetch("/api/program-assignment", {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "csrf-token": String(session?.csrfToken || "")
      },
      body: JSON.stringify(body)
    });

    return {
      status: response.status,
      body: await response.text()
    };
  }, payload);
}

test("user can choose and start a Convict Conditioning program", async ({ page }) => {
  await ensureProgramSelectionFixture({
    email: DEV_USER_EMAIL,
    username: USERNAME,
    displayName: DISPLAY_NAME
  });
  await devLoginAs(page, {
    email: DEV_USER_EMAIL
  });

  await page.goto("/app");

  await expect(page.getByRole("heading", { name: "Start your first program" })).toBeVisible();
  await expect(page.getByText("New Blood")).toBeVisible();
  await expect(page.getByText("Good Behavior")).toBeVisible();

  await page.getByText("New Blood").first().click();
  await page.locator('input[type="date"]').fill(STARTS_ON);
  await page.getByRole("button", { name: "Start Program" }).click();

  const activeProgramsPanel = page.locator(".active-programs-panel");
  const activeProgramCard = activeProgramsPanel.locator(".active-program-card").filter({ hasText: "New Blood" }).first();
  await expect(page.getByRole("status").getByText("Program started.")).toBeVisible();
  await expect(activeProgramsPanel.getByRole("heading", { name: "1 program" })).toBeVisible();
  await expect(activeProgramCard.getByRole("heading", { name: "New Blood" })).toBeVisible();
  await expect(activeProgramCard.getByRole("button", { name: "Show details" })).toBeVisible();
  await expect(activeProgramCard.getByText("working sets")).toHaveCount(0);

  await activeProgramCard.getByRole("button", { name: "Show details" }).click();
  await expect(activeProgramCard.getByRole("button", { name: "Hide details" })).toBeVisible();
  await expect(page.getByText("Started Wednesday, 6 May 2026")).toBeVisible();
  await expect(activeProgramCard.getByText("Canonical Convict Conditioning template")).toHaveCount(0);
  await expect(activeProgramCard.getByText("New Blood").first()).toBeVisible();
  await expect(activeProgramCard.getByText("working sets").first()).toBeVisible();

  await page.reload();

  await expect(activeProgramCard.getByRole("heading", { name: "New Blood" })).toBeVisible();
  await expect(activeProgramCard.getByRole("button", { name: "Show details" })).toBeVisible();
  await expect(activeProgramCard.getByText("working sets")).toHaveCount(0);
});

test("user adds a second program from the full picker but cannot copy the same program twice", async ({ page }) => {
  await ensureProgramSelectionFixture({
    email: DEV_USER_EMAIL,
    username: USERNAME,
    displayName: DISPLAY_NAME
  });
  await devLoginAs(page, {
    email: DEV_USER_EMAIL
  });

  await page.goto("/app");

  await page.getByText("New Blood").first().click();
  await page.locator('input[type="date"]').fill(STARTS_ON);
  await page.getByRole("button", { name: "Start Program" }).click();

  await expect(page.getByRole("status").getByText("Program started.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add another program" })).toBeVisible();

  const stateAfterFirstStart = await readProgramSelectionState(page);
  const newBlood = stateAfterFirstStart.programVersions.find((programVersion) => programVersion.name === "New Blood");
  expect(newBlood?.alreadyActive).toBe(true);

  const duplicateResponse = await postProgramStart(page, {
    programVersionId: newBlood.id,
    startsOn: STARTS_ON
  });
  expect(duplicateResponse.status).toBe(409);
  expect(duplicateResponse.body).toContain("This program is already active.");

  await page.getByRole("button", { name: "Add another program" }).click();

  const newBloodOption = page.getByRole("button", { name: /New Blood\s+Already active/ });
  await expect(newBloodOption).toBeVisible();
  await expect(newBloodOption).toBeDisabled();

  await page.getByRole("button", { name: /Good Behavior\s+Balanced/ }).click();
  await page.locator('input[type="date"]').fill(STARTS_ON);
  await page.getByRole("button", { name: "Start Program" }).click();

  await expect(page.getByRole("status").getByText("Program started.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add another program" })).toBeVisible();
  await expect(page.locator(".active-programs-panel").getByRole("heading", { name: "2 programs" })).toBeVisible();

  const stateAfterSecondStart = await readProgramSelectionState(page);
  expect(stateAfterSecondStart.activeAssignments).toHaveLength(2);
  expect(
    stateAfterSecondStart.programVersions
      .filter((programVersion) => ["New Blood", "Good Behavior"].includes(programVersion.name))
      .every((programVersion) => programVersion.alreadyActive === true)
  ).toBe(true);
});
