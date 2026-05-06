const TABLE_NAME = "workout_occurrence_exercises";

exports.up = async function up(knex) {
  const hasCrudTable = await knex.schema.hasTable(TABLE_NAME);
  if (hasCrudTable) {
    return;
  }

  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.bigIncrements("id").unsigned().primary();
    table.bigInteger("workout_occurrence_id").unsigned().notNullable();
    table.bigInteger("user_id").unsigned().notNullable();
    table.bigInteger("workspace_id").unsigned().nullable();
    table.smallint("slot_number").unsigned().notNullable();
    table.bigInteger("exercise_id").unsigned().notNullable();
    table.string("exercise_name_snapshot", 160).notNullable();
    table.bigInteger("canonical_step_id").unsigned().notNullable();
    table.string("canonical_step_name_snapshot", 160).notNullable();
    table.bigInteger("personal_step_variation_id").unsigned().nullable();
    table.string("variation_name_snapshot", 160).nullable();
    table.string("measurement_unit_snapshot", 16).notNullable();
    table.smallint("planned_work_sets_min").unsigned().notNullable();
    table.smallint("planned_work_sets_max").unsigned().notNullable();
    table.smallint("progression_sets_snapshot").unsigned().nullable();
    table.smallint("progression_reps_min_snapshot").unsigned().nullable();
    table.smallint("progression_reps_max_snapshot").unsigned().nullable();
    table.smallint("progression_seconds_snapshot").unsigned().nullable();
    table.string("status", 32).notNullable().defaultTo("pending");
    table.text("notes").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.index(["personal_step_variation_id"], "fk_workout_occurrence_exercises_personal_step_variation_id");
    table.index(["canonical_step_id"], "idx_workout_occurrence_exercises_canonical_step_id");
    table.index(["exercise_id"], "idx_workout_occurrence_exercises_exercise_id");
    table.index(["user_id"], "idx_workout_occurrence_exercises_user_id");
    table.index(["workspace_id"], "idx_workout_occurrence_exercises_workspace_id");
    table.unique(["workout_occurrence_id","exercise_id"], "uq_workout_occurrence_exercises_occurrence_exercise");
    table.unique(["workout_occurrence_id","slot_number"], "uq_workout_occurrence_exercises_occurrence_slot");
    table.foreign(["canonical_step_id"], "fk_workout_occurrence_exercises_canonical_step_id").references(["id"]).inTable("exercise_steps").onUpdate("RESTRICT").onDelete("RESTRICT");
    table.foreign(["exercise_id"], "fk_workout_occurrence_exercises_exercise_id").references(["id"]).inTable("exercises").onUpdate("RESTRICT").onDelete("RESTRICT");
    table.foreign(["workout_occurrence_id"], "fk_workout_occurrence_exercises_occurrence_id").references(["id"]).inTable("workout_occurrences").onUpdate("RESTRICT").onDelete("CASCADE");
    table.foreign(["personal_step_variation_id"], "fk_workout_occurrence_exercises_personal_step_variation_id").references(["id"]).inTable("personal_step_variations").onUpdate("RESTRICT").onDelete("SET NULL");
    table.foreign(["user_id"], "fk_workout_occurrence_exercises_user_id").references(["id"]).inTable("users").onUpdate("RESTRICT").onDelete("CASCADE");
    table.foreign(["workspace_id"], "fk_workout_occurrence_exercises_workspace_id").references(["id"]).inTable("workspaces").onUpdate("RESTRICT").onDelete("SET NULL");
  });

};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists(TABLE_NAME);
};
