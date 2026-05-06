const TABLE_NAME = "programs";

exports.up = async function up(knex) {
  const hasCrudTable = await knex.schema.hasTable(TABLE_NAME);
  if (hasCrudTable) {
    return;
  }

  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.bigIncrements("id").unsigned().primary();
    table.bigInteger("user_id").unsigned().notNullable();
    table.bigInteger("program_template_id").unsigned().nullable();
    table.string("name", 160).notNullable();
    table.text("description").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.index(["program_template_id"], "idx_programs_program_template_id");
    table.index(["user_id"], "idx_programs_user_id");
    table.foreign(["program_template_id"], "fk_programs_program_template_id").references(["id"]).inTable("program_templates").onUpdate("RESTRICT").onDelete("SET NULL");
    table.foreign(["user_id"], "fk_programs_user_id").references(["id"]).inTable("users").onUpdate("RESTRICT").onDelete("CASCADE");
  });

};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists(TABLE_NAME);
};
