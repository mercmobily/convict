const TABLE_NAME = "workout_occurrences";

exports.up = async function up(knex) {
  const hasCrudTable = await knex.schema.hasTable(TABLE_NAME);
  if (hasCrudTable) {
    return;
  }

  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.bigIncrements("id").unsigned().primary();
    table.bigInteger("user_id").unsigned().notNullable();
    table.bigInteger("user_program_assignment_id").unsigned().notNullable();
    table.bigInteger("user_program_assignment_revision_id").unsigned().notNullable();
    table.date("scheduled_for_date").notNullable();
    table.date("performed_on_date").nullable();
    table.string("status", 32).notNullable().defaultTo("in_progress");
    table.timestamp("started_at").nullable();
    table.timestamp("submitted_at").nullable();
    table.timestamp("definitely_missed_at").nullable();
    table.text("notes").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.index(["user_program_assignment_revision_id","scheduled_for_date"], "idx_workout_occurrences_revision_scheduled_date");
    table.index(["user_id"], "idx_workout_occurrences_user_id");
    table.index(["user_id","performed_on_date"], "idx_workout_occurrences_user_performed_date");
    table.index(["user_id","scheduled_for_date"], "idx_workout_occurrences_user_scheduled_date");
    table.unique(["user_program_assignment_id","scheduled_for_date"], "uq_workout_occurrences_assignment_scheduled_date");
    table.foreign(["user_program_assignment_id"], "fk_workout_occurrences_assignment_id").references(["id"]).inTable("user_program_assignments").onUpdate("RESTRICT").onDelete("RESTRICT");
    table.foreign(["user_program_assignment_revision_id"], "fk_workout_occurrences_assignment_revision_id").references(["id"]).inTable("user_program_assignment_revisions").onUpdate("RESTRICT").onDelete("RESTRICT");
    table.foreign(["user_id"], "fk_workout_occurrences_user_id").references(["id"]).inTable("users").onUpdate("RESTRICT").onDelete("CASCADE");
  });

};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists(TABLE_NAME);
};
