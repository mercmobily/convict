const TABLE_NAME = "workout_set_logs";

exports.up = async function up(knex) {
  const hasCrudTable = await knex.schema.hasTable(TABLE_NAME);
  if (hasCrudTable) {
    return;
  }

  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.bigIncrements("id").unsigned().primary();
    table.bigInteger("workout_occurrence_exercise_id").unsigned().notNullable();
    table.bigInteger("user_id").unsigned().notNullable();
    table.smallint("set_number").unsigned().notNullable();
    table.string("side", 16).notNullable().defaultTo("both");
    table.string("measurement_unit_snapshot", 16).notNullable();
    table.smallint("performed_value").unsigned().notNullable();
    table.boolean("qualifies_for_progression").notNullable().defaultTo(false);
    table.timestamp("logged_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.index(["logged_at"], "idx_workout_set_logs_logged_at");
    table.index(["user_id"], "idx_workout_set_logs_user_id");
    table.unique(["workout_occurrence_exercise_id","set_number","side"], "uq_workout_set_logs_occurrence_exercise_set_side");
    table.foreign(["workout_occurrence_exercise_id"], "fk_workout_set_logs_occurrence_exercise_id").references(["id"]).inTable("workout_occurrence_exercises").onUpdate("RESTRICT").onDelete("CASCADE");
    table.foreign(["user_id"], "fk_workout_set_logs_user_id").references(["id"]).inTable("users").onUpdate("RESTRICT").onDelete("CASCADE");
  });

};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists(TABLE_NAME);
};
