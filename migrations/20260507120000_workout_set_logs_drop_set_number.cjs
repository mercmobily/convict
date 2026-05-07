const TABLE_NAME = "workout_set_logs";
const COLUMN_NAME = "set_number";
const UNIQUE_INDEX_NAME = "uq_workout_set_logs_occurrence_exercise_set_side";
const OCCURRENCE_EXERCISE_INDEX_NAME = "idx_workout_set_logs_occurrence_exercise_id";

async function hasIndex(knex, tableName, indexName) {
  const [rows] = await knex.raw("SHOW INDEX FROM ?? WHERE Key_name = ?", [tableName, indexName]);
  return Array.isArray(rows) && rows.length > 0;
}

exports.up = async function up(knex) {
  const hasTable = await knex.schema.hasTable(TABLE_NAME);
  if (!hasTable) {
    return;
  }

  const hasSetNumber = await knex.schema.hasColumn(TABLE_NAME, COLUMN_NAME);
  if (!hasSetNumber) {
    return;
  }

  const hasOccurrenceExerciseIndex = await hasIndex(knex, TABLE_NAME, OCCURRENCE_EXERCISE_INDEX_NAME);
  if (!hasOccurrenceExerciseIndex) {
    await knex.raw(
      "ALTER TABLE ?? ADD INDEX ?? (workout_occurrence_exercise_id)",
      [TABLE_NAME, OCCURRENCE_EXERCISE_INDEX_NAME]
    );
  }

  await knex.raw(
    "ALTER TABLE ?? DROP INDEX ??, DROP COLUMN ??",
    [TABLE_NAME, UNIQUE_INDEX_NAME, COLUMN_NAME]
  );
};

exports.down = async function down(knex) {
  const hasTable = await knex.schema.hasTable(TABLE_NAME);
  if (!hasTable) {
    return;
  }

  const hasSetNumber = await knex.schema.hasColumn(TABLE_NAME, COLUMN_NAME);
  if (hasSetNumber) {
    return;
  }

  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.smallint(COLUMN_NAME).unsigned().nullable();
  });

  await knex.raw("SET @current_occurrence_exercise_id := NULL");
  await knex.raw("SET @current_set_number := 0");
  await knex.raw(`
    UPDATE ${TABLE_NAME} target
    JOIN (
      SELECT
        id,
        @current_set_number := IF(
          @current_occurrence_exercise_id = workout_occurrence_exercise_id,
          @current_set_number + 1,
          1
        ) AS computed_set_number,
        @current_occurrence_exercise_id := workout_occurrence_exercise_id AS current_occurrence_exercise_id
      FROM ${TABLE_NAME}
      ORDER BY workout_occurrence_exercise_id, logged_at, id
    ) ordered ON ordered.id = target.id
    SET target.${COLUMN_NAME} = ordered.computed_set_number
  `);

  await knex.raw(
    "ALTER TABLE ?? MODIFY COLUMN ?? SMALLINT UNSIGNED NOT NULL",
    [TABLE_NAME, COLUMN_NAME]
  );
  await knex.raw(
    "ALTER TABLE ?? ADD UNIQUE ?? (workout_occurrence_exercise_id, set_number, side)",
    [TABLE_NAME, UNIQUE_INDEX_NAME]
  );

  const hasOccurrenceExerciseIndex = await hasIndex(knex, TABLE_NAME, OCCURRENCE_EXERCISE_INDEX_NAME);
  if (hasOccurrenceExerciseIndex) {
    await knex.raw(
      "ALTER TABLE ?? DROP INDEX ??",
      [TABLE_NAME, OCCURRENCE_EXERCISE_INDEX_NAME]
    );
  }
};
