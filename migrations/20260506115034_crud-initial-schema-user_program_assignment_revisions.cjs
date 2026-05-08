const TABLE_NAME = "user_program_assignment_revisions";

exports.up = async function up(knex) {
  const hasCrudTable = await knex.schema.hasTable(TABLE_NAME);
  if (hasCrudTable) {
    return;
  }

  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.bigIncrements("id").unsigned().primary();
    table.bigInteger("user_program_assignment_id").unsigned().notNullable();
    table.bigInteger("user_id").unsigned().notNullable();
    table.bigInteger("program_id").unsigned().notNullable();
    table.date("effective_from_date").notNullable();
    table.string("change_reason", 64).notNullable().defaultTo("initial");
    table.text("notes").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.index(["user_program_assignment_id","effective_from_date"], "idx_user_program_assignment_revisions_assignment_effective_date");
    table.index(["program_id"], "idx_user_program_assignment_revisions_program_id");
    table.index(["user_id"], "idx_user_program_assignment_revisions_user_id");
    table.unique(["user_program_assignment_id","effective_from_date"], "uq_user_program_assignment_revisions_assignment_effective_date");
    table.foreign(["user_program_assignment_id"], "fk_user_program_assignment_revisions_assignment_id").references(["id"]).inTable("user_program_assignments").onUpdate("RESTRICT").onDelete("CASCADE");
    table.foreign(["program_id"], "fk_user_program_assignment_revisions_program_id").references(["id"]).inTable("programs").onUpdate("RESTRICT").onDelete("RESTRICT");
    table.foreign(["user_id"], "fk_user_program_assignment_revisions_user_id").references(["id"]).inTable("users").onUpdate("RESTRICT").onDelete("CASCADE");
  });

};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists(TABLE_NAME);
};
