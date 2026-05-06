const TABLE_NAME = "user_exercise_progress";

exports.up = async function up(knex) {
  const hasCrudTable = await knex.schema.hasTable(TABLE_NAME);
  if (hasCrudTable) {
    return;
  }

  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.bigIncrements("id").unsigned().primary();
    table.bigInteger("user_id").unsigned().notNullable();
    table.bigInteger("workspace_id").unsigned().nullable();
    table.bigInteger("exercise_id").unsigned().notNullable();
    table.bigInteger("current_step_id").unsigned().notNullable();
    table.bigInteger("ready_to_advance_step_id").unsigned().nullable();
    table.bigInteger("active_variation_id").unsigned().nullable();
    table.timestamp("ready_to_advance_at").nullable();
    table.bigInteger("last_completed_occurrence_id").unsigned().nullable();
    table.timestamp("last_completed_at").nullable();
    table.smallint("stall_count").unsigned().notNullable().defaultTo(0);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.index(["active_variation_id"], "fk_user_exercise_progress_active_variation_id");
    table.index(["exercise_id"], "fk_user_exercise_progress_exercise_id");
    table.index(["last_completed_occurrence_id"], "fk_user_exercise_progress_last_completed_occurrence_id");
    table.index(["workspace_id"], "fk_user_exercise_progress_workspace_id");
    table.index(["current_step_id"], "idx_user_exercise_progress_current_step_id");
    table.index(["ready_to_advance_step_id"], "idx_user_exercise_progress_ready_step_id");
    table.unique(["user_id","exercise_id"], "uq_user_exercise_progress_user_exercise");
    table.foreign(["active_variation_id"], "fk_user_exercise_progress_active_variation_id").references(["id"]).inTable("personal_step_variations").onUpdate("RESTRICT").onDelete("SET NULL");
    table.foreign(["current_step_id"], "fk_user_exercise_progress_current_step_id").references(["id"]).inTable("exercise_steps").onUpdate("RESTRICT").onDelete("RESTRICT");
    table.foreign(["exercise_id"], "fk_user_exercise_progress_exercise_id").references(["id"]).inTable("exercises").onUpdate("RESTRICT").onDelete("CASCADE");
    table.foreign(["last_completed_occurrence_id"], "fk_user_exercise_progress_last_completed_occurrence_id").references(["id"]).inTable("workout_occurrences").onUpdate("RESTRICT").onDelete("RESTRICT");
    table.foreign(["ready_to_advance_step_id"], "fk_user_exercise_progress_ready_to_advance_step_id").references(["id"]).inTable("exercise_steps").onUpdate("RESTRICT").onDelete("RESTRICT");
    table.foreign(["user_id"], "fk_user_exercise_progress_user_id").references(["id"]).inTable("users").onUpdate("RESTRICT").onDelete("CASCADE");
    table.foreign(["workspace_id"], "fk_user_exercise_progress_workspace_id").references(["id"]).inTable("workspaces").onUpdate("RESTRICT").onDelete("SET NULL");
  });

};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists(TABLE_NAME);
};
