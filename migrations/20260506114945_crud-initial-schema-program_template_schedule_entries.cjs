const TABLE_NAME = "program_template_schedule_entries";

exports.up = async function up(knex) {
  const hasCrudTable = await knex.schema.hasTable(TABLE_NAME);
  if (hasCrudTable) {
    return;
  }

  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.bigIncrements("id").unsigned().primary();
    table.bigInteger("program_template_id").unsigned().notNullable();
    table.specificType("day_of_week", "tinyint(3) unsigned").notNullable();
    table.specificType("slot_number", "tinyint(3) unsigned").notNullable().defaultTo(1);
    table.bigInteger("exercise_id").unsigned().notNullable();
    table.specificType("work_sets_min", "tinyint(3) unsigned").notNullable();
    table.specificType("work_sets_max", "tinyint(3) unsigned").notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.index(["exercise_id"], "idx_program_template_schedule_entries_exercise_id");
    table.index(["program_template_id","day_of_week"], "idx_program_template_schedule_entries_program_day");
    table.index(["program_template_id"], "idx_program_template_schedule_entries_program_id");
    table.unique(["program_template_id","day_of_week","exercise_id"], "uq_program_template_schedule_entries_program_day_exercise");
    table.unique(["program_template_id","day_of_week","slot_number"], "uq_program_template_schedule_entries_program_day_slot");
    table.foreign(["exercise_id"], "fk_program_template_schedule_entries_exercise_id").references(["id"]).inTable("exercises").onUpdate("RESTRICT").onDelete("RESTRICT");
    table.foreign(["program_template_id"], "fk_program_template_schedule_entries_program_id").references(["id"]).inTable("program_templates").onUpdate("RESTRICT").onDelete("CASCADE");
  });

};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists(TABLE_NAME);
};
