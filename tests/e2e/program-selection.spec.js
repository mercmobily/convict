import "dotenv/config";
import mysql from "mysql2/promise";
import { test, expect } from "@playwright/test";

const DEV_USER_EMAIL = "slice1-playwright@convict.local";
const WORKSPACE_SLUG = "slice1-playwright";
const WORKSPACE_NAME = "Slice 1 Playwright";
const STARTS_ON = "2026-05-06";

function createDbConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });
}

async function deleteUserTrainingRows(connection, userId) {
  await connection.query(
    [
      "DELETE wsl FROM workout_set_logs wsl",
      "INNER JOIN workout_occurrence_exercises woe",
      "ON woe.id = wsl.workout_occurrence_exercise_id",
      "INNER JOIN workout_occurrences wo",
      "ON wo.id = woe.workout_occurrence_id",
      "WHERE wo.user_id = ?"
    ].join(" "),
    [userId]
  );

  await connection.query(
    [
      "DELETE woe FROM workout_occurrence_exercises woe",
      "INNER JOIN workout_occurrences wo",
      "ON wo.id = woe.workout_occurrence_id",
      "WHERE wo.user_id = ?"
    ].join(" "),
    [userId]
  );

  await connection.query(
    "DELETE FROM user_exercise_progress WHERE user_id = ?",
    [userId]
  );
  await connection.query(
    "DELETE FROM personal_step_variations WHERE user_id = ?",
    [userId]
  );
  await connection.query(
    "DELETE FROM workout_occurrences WHERE user_id = ?",
    [userId]
  );
  await connection.query(
    [
      "DELETE FROM user_program_assignment_revisions",
      "WHERE user_program_assignment_id IN (",
      "  SELECT id FROM user_program_assignments WHERE user_id = ?",
      ")"
    ].join(" "),
    [userId]
  );
  await connection.query(
    "DELETE FROM user_program_assignments WHERE user_id = ?",
    [userId]
  );
}

async function ensureProgramSelectionFixture({ email, workspaceSlug, workspaceName }) {
  const connection = await createDbConnection();

  try {
    await connection.beginTransaction();

    try {
      const username = workspaceSlug;
      const displayName = workspaceName;
      const authProvider = "supabase";
      const authProviderUserSid = `playwright-${workspaceSlug}`;

      const [userRows] = await connection.query(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
        [email]
      );
      let userId = userRows?.[0]?.id || null;

      if (!userId) {
        const [insertUserResult] = await connection.query(
          [
            "INSERT INTO users (auth_provider, auth_provider_user_sid, email, username, display_name)",
            "VALUES (?, ?, ?, ?, ?)"
          ].join(" "),
          [authProvider, authProviderUserSid, email, username, displayName]
        );
        userId = insertUserResult.insertId;
      } else {
        await connection.query(
          [
            "UPDATE users",
            "SET username = ?, display_name = ?",
            "WHERE id = ?"
          ].join(" "),
          [username, displayName, userId]
        );
      }

      const [workspaceRows] = await connection.query(
        "SELECT id FROM workspaces WHERE slug = ? LIMIT 1",
        [workspaceSlug]
      );
      let workspaceId = workspaceRows?.[0]?.id || null;

      if (!workspaceId) {
        const [insertWorkspaceResult] = await connection.query(
          [
            "INSERT INTO workspaces (slug, name, owner_user_id, is_personal, avatar_url)",
            "VALUES (?, ?, ?, ?, ?)"
          ].join(" "),
          [workspaceSlug, workspaceName, userId, 1, ""]
        );
        workspaceId = insertWorkspaceResult.insertId;
      } else {
        await connection.query(
          [
            "UPDATE workspaces",
            "SET name = ?, owner_user_id = ?, is_personal = ?, avatar_url = ?, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP",
            "WHERE id = ?"
          ].join(" "),
          [workspaceName, userId, 1, "", workspaceId]
        );
      }

      await connection.query(
        [
          "INSERT INTO workspace_memberships (workspace_id, user_id, role_sid, status)",
          "VALUES (?, ?, ?, ?)",
          "ON DUPLICATE KEY UPDATE",
          "role_sid = VALUES(role_sid),",
          "status = VALUES(status),",
          "updated_at = CURRENT_TIMESTAMP"
        ].join(" "),
        [workspaceId, userId, "owner", "active"]
      );

      await connection.query(
        [
          "INSERT INTO workspace_settings (workspace_id)",
          "VALUES (?)",
          "ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP"
        ].join(" "),
        [workspaceId]
      );

      await deleteUserTrainingRows(connection, userId);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    await connection.end();
  }
}

async function devLoginAs(page, { email }) {
  await page.goto("/");

  await page.evaluate(async ({ email: targetEmail }) => {
    const sessionResponse = await fetch("/api/session", {
      credentials: "include"
    });
    if (!sessionResponse.ok) {
      throw new Error(`Session bootstrap failed: ${sessionResponse.status}`);
    }

    const sessionPayload = await sessionResponse.json();
    const csrfToken = String(sessionPayload?.csrfToken || "");
    if (!csrfToken) {
      throw new Error("Missing csrfToken from /api/session.");
    }

    const loginResponse = await fetch("/api/dev-auth/login-as", {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "csrf-token": csrfToken
      },
      body: JSON.stringify({ email: targetEmail })
    });

    if (!loginResponse.ok) {
      throw new Error(`Dev login failed: ${loginResponse.status} ${await loginResponse.text()}`);
    }
  }, { email });
}

test("user can choose and start a Convict Conditioning program", async ({ page }) => {
  await ensureProgramSelectionFixture({
    email: DEV_USER_EMAIL,
    workspaceSlug: WORKSPACE_SLUG,
    workspaceName: WORKSPACE_NAME
  });
  await devLoginAs(page, {
    email: DEV_USER_EMAIL
  });

  await page.goto(`/w/${WORKSPACE_SLUG}/`);

  await expect(page.getByRole("heading", { name: "Start your first program" })).toBeVisible();
  await expect(page.getByText("New Blood")).toBeVisible();
  await expect(page.getByText("Good Behavior")).toBeVisible();

  await page.getByText("New Blood").first().click();
  await page.locator('input[type="date"]').fill(STARTS_ON);
  await page.getByRole("button", { name: "Start Program" }).click();

  const activeProgramCard = page.locator(".active-program-card");
  await expect(page.getByRole("status").getByText("Program started.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your active program" })).toBeVisible();
  await expect(activeProgramCard.getByRole("button", { name: "Show details" })).toBeVisible();
  await expect(activeProgramCard.getByText("Weekly schedule")).toHaveCount(0);

  await activeProgramCard.getByRole("button", { name: "Show details" }).click();
  await expect(activeProgramCard.getByRole("button", { name: "Hide details" })).toBeVisible();
  await expect(page.getByText(`Starts ${STARTS_ON}`)).toBeVisible();
  await expect(activeProgramCard.getByText("New Blood").first()).toBeVisible();
  await expect(activeProgramCard.getByText("Weekly schedule")).toBeVisible();

  await page.reload();

  await expect(page.getByRole("heading", { name: "Your active program" })).toBeVisible();
  await expect(activeProgramCard.getByRole("button", { name: "Show details" })).toBeVisible();
  await expect(activeProgramCard.getByText("Weekly schedule")).toHaveCount(0);
});
