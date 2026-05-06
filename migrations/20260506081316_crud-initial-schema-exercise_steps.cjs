const TABLE_NAME = "exercise_steps";

exports.up = async function up(knex) {
  const hasCrudTable = await knex.schema.hasTable(TABLE_NAME);
  if (hasCrudTable) {
    return;
  }

  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.bigIncrements("id").unsigned().primary();
    table.bigInteger("exercise_id").unsigned().notNullable();
    table.specificType("step_number", "tinyint(3) unsigned").notNullable();
    table.string("step_name", 160).notNullable();
    table.text("instruction_text").nullable();
    table.string("measurement_unit", 16).notNullable().defaultTo("reps");
    table.smallint("beginner_sets").unsigned().nullable();
    table.smallint("beginner_reps").unsigned().nullable();
    table.smallint("beginner_seconds").unsigned().nullable();
    table.smallint("intermediate_sets").unsigned().nullable();
    table.smallint("intermediate_reps").unsigned().nullable();
    table.smallint("intermediate_seconds").unsigned().nullable();
    table.smallint("progression_sets").unsigned().nullable();
    table.smallint("progression_reps_min").unsigned().nullable();
    table.smallint("progression_reps_max").unsigned().nullable();
    table.smallint("progression_seconds").unsigned().nullable();
    table.specificType("source_page", "tinyint(3) unsigned").notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.index(["exercise_id"], "idx_exercise_steps_exercise_id");
    table.index(["source_page"], "idx_exercise_steps_source_page");
    table.unique(["exercise_id","step_number"], "uq_exercise_steps_exercise_step_number");
    table.foreign(["exercise_id"], "fk_exercise_steps_exercise_id").references(["id"]).inTable("exercises").onUpdate("RESTRICT").onDelete("CASCADE");
  });

};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists(TABLE_NAME);
};
