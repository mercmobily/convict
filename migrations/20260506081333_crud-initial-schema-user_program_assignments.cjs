const TABLE_NAME = "user_program_assignments";

exports.up = async function up(knex) {
  const hasCrudTable = await knex.schema.hasTable(TABLE_NAME);
  if (hasCrudTable) {
    return;
  }

  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.bigIncrements("id").unsigned().primary();
    table.bigInteger("user_id").unsigned().notNullable();
    table.bigInteger("workspace_id").unsigned().nullable();
    table.date("starts_on").notNullable();
    table.date("ends_on").nullable();
    table.string("status", 32).notNullable().defaultTo("active");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.index(["user_id"], "idx_user_program_assignments_user_id");
    table.index(["user_id","status"], "idx_user_program_assignments_user_status");
    table.index(["workspace_id"], "idx_user_program_assignments_workspace_id");
    table.foreign(["user_id"], "fk_user_program_assignments_user_id").references(["id"]).inTable("users").onUpdate("RESTRICT").onDelete("CASCADE");
    table.foreign(["workspace_id"], "fk_user_program_assignments_workspace_id").references(["id"]).inTable("workspaces").onUpdate("RESTRICT").onDelete("SET NULL");
  });

};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists(TABLE_NAME);
};
