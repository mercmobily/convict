const TABLE_NAME = "personal_step_variations";

exports.up = async function up(knex) {
  const hasCrudTable = await knex.schema.hasTable(TABLE_NAME);
  if (hasCrudTable) {
    return;
  }

  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.bigIncrements("id").unsigned().primary();
    table.bigInteger("user_id").unsigned().notNullable();
    table.bigInteger("canonical_step_id").unsigned().notNullable();
    table.string("name", 160).notNullable();
    table.string("measurement_unit", 16).notNullable().defaultTo("reps");
    table.string("reason", 160).nullable();
    table.text("notes").nullable();
    table.string("status", 32).notNullable().defaultTo("active");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.index(["canonical_step_id"], "idx_personal_step_variations_canonical_step_id");
    table.index(["user_id"], "idx_personal_step_variations_user_id");
    table.index(["user_id","canonical_step_id","status"], "idx_personal_step_variations_user_step_status");
    table.foreign(["canonical_step_id"], "fk_personal_step_variations_canonical_step_id").references(["id"]).inTable("exercise_steps").onUpdate("RESTRICT").onDelete("CASCADE");
    table.foreign(["user_id"], "fk_personal_step_variations_user_id").references(["id"]).inTable("users").onUpdate("RESTRICT").onDelete("CASCADE");
  });

};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists(TABLE_NAME);
};
