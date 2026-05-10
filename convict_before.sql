/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-12.0.2-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: convict
-- ------------------------------------------------------
-- Server version	12.0.2-MariaDB-ubu2404

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `console_settings`
--

DROP TABLE IF EXISTS `console_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `console_settings` (
  `id` bigint(20) NOT NULL,
  `owner_user_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `console_settings_owner_user_id_foreign` (`owner_user_id`),
  CONSTRAINT `console_settings_owner_user_id_foreign` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `console_settings`
--

LOCK TABLES `console_settings` WRITE;
/*!40000 ALTER TABLE `console_settings` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `console_settings` VALUES
(1,11,'2026-05-06 14:45:16','2026-05-06 15:51:59');
/*!40000 ALTER TABLE `console_settings` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `exercise_steps`
--

DROP TABLE IF EXISTS `exercise_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `exercise_steps` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `exercise_id` bigint(20) unsigned NOT NULL,
  `step_number` tinyint(3) unsigned NOT NULL,
  `step_name` varchar(160) NOT NULL,
  `instruction_text` text DEFAULT NULL,
  `measurement_unit` varchar(16) NOT NULL DEFAULT 'reps',
  `beginner_sets` smallint(5) unsigned DEFAULT NULL,
  `beginner_reps` smallint(5) unsigned DEFAULT NULL,
  `beginner_seconds` smallint(5) unsigned DEFAULT NULL,
  `intermediate_sets` smallint(5) unsigned DEFAULT NULL,
  `intermediate_reps` smallint(5) unsigned DEFAULT NULL,
  `intermediate_seconds` smallint(5) unsigned DEFAULT NULL,
  `progression_sets` smallint(5) unsigned DEFAULT NULL,
  `progression_reps_min` smallint(5) unsigned DEFAULT NULL,
  `progression_reps_max` smallint(5) unsigned DEFAULT NULL,
  `progression_seconds` smallint(5) unsigned DEFAULT NULL,
  `source_page` tinyint(3) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_exercise_steps_exercise_step_number` (`exercise_id`,`step_number`),
  KEY `idx_exercise_steps_exercise_id` (`exercise_id`),
  KEY `idx_exercise_steps_source_page` (`source_page`),
  CONSTRAINT `fk_exercise_steps_exercise_id` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exercise_steps`
--

LOCK TABLES `exercise_steps` WRITE;
/*!40000 ALTER TABLE `exercise_steps` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `exercise_steps` VALUES
(1,1,1,'Wall Push-ups','Stand facing a wall and press your body away from the wall with straight-body reps. Keep your hands chest-high and control both the lowering and the lockout.','reps',1,10,NULL,2,25,NULL,3,50,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(2,1,2,'Incline Push-ups','Use a sturdy bench or table so your hands are elevated and your body stays in a straight line. Lower your chest to the edge, then press back up.','reps',1,10,NULL,2,20,NULL,3,40,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(3,1,3,'Kneeling Push-ups','Set up like a normal push-up but keep your knees on the floor. Lower under control and press back to full arm extension.','reps',1,10,NULL,2,15,NULL,3,30,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(4,1,4,'Half Push-ups','Use a partial range from the top half of a standard push-up. Keep your body tight and work clean, even reps.','reps',1,8,NULL,2,12,NULL,2,25,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(5,1,5,'Full Push-ups','Perform standard floor push-ups with a straight body. Lower until your chest is close to the floor and press to lockout.','reps',1,5,NULL,2,10,NULL,2,20,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(6,1,6,'Close Push-ups','Bring your hands closer than shoulder width to emphasize triceps and chest. Keep elbows controlled and body rigid.','reps',1,5,NULL,2,10,NULL,2,20,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(7,1,7,'Uneven Push-ups','Place one hand on a raised surface like a ball or block and the other on the floor. Let the floor hand do most of the work while you keep your torso square.','reps',1,5,NULL,2,10,NULL,2,20,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(8,1,8,'Half One-Arm Push-ups','Work a one-arm push-up pattern through a shortened range. Brace hard and avoid twisting as you press.','reps',1,5,NULL,2,10,NULL,2,20,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(9,1,9,'Lever Push-ups','Set up one-arm style but use the free arm as a light lever for balance, not a full assist. Keep the pressing arm doing the main work.','reps',1,5,NULL,2,10,NULL,2,20,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(10,1,10,'One-Arm Push-ups','Perform strict one-arm push-ups with the working hand under the shoulder and feet set wide for balance. Control the descent and avoid rotating the hips.','reps',1,5,NULL,2,10,NULL,1,100,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(11,2,1,'Shoulderstand Squats','From a shoulderstand, tuck and extend the legs to learn the squat pattern with minimal load. Move smoothly and keep the lower back supported.','reps',1,10,NULL,2,25,NULL,3,50,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(12,2,2,'Jackknife Squats','Use your hands on a support and let your legs do most of the work from a deep squat. Sit back and stand up under control.','reps',1,10,NULL,2,20,NULL,3,40,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(13,2,3,'Supported Squats','Hold a stable support and squat deeper while using only enough assistance to stay balanced. Try to keep weight through the feet.','reps',1,10,NULL,2,15,NULL,3,30,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(14,2,4,'Half Squats','Perform standing squats through the top half of the range. Keep your knees tracking over the feet and stand tall at the top.','reps',1,8,NULL,2,35,NULL,2,50,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(15,2,5,'Full Squats','Squat through a full comfortable range and stand back up without bouncing. Keep your heels down and chest controlled.','reps',1,5,NULL,2,10,NULL,2,30,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(16,2,6,'Close Squats','Use a narrower stance than usual and descend under control. Stay balanced and keep the knees aligned.','reps',1,5,NULL,2,10,NULL,2,20,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(17,2,7,'Uneven Squats','Shift more load onto one leg while the other leg lightly assists. Keep the hips level as you descend and rise.','reps',1,5,NULL,2,10,NULL,2,20,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(18,2,8,'Half One-Leg Squats','Use a pistol-style stance through a shorter range on one leg. Move slowly and keep the working foot planted.','reps',1,5,NULL,2,10,NULL,2,20,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(19,2,9,'Assisted One-Leg Squats','Perform one-leg squats with light assistance from a support for balance and control. Let the working leg handle most of the load.','reps',1,5,NULL,2,10,NULL,2,20,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(20,2,10,'One-Leg Squats','Perform strict one-leg squats on a single working leg. Control the descent, keep balance, and stand without twisting.','reps',1,5,NULL,2,10,NULL,2,50,NULL,NULL,1,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(21,3,1,'Vertical Pulls','Use a vertical support like a doorframe or post and lean back so you can pull your body toward the hands. Keep the movement smooth and controlled.','reps',1,10,NULL,2,20,NULL,3,40,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(22,3,2,'Horizontal Pulls','Set up under a low bar or sturdy table and row your chest toward it. Keep your body straight and squeeze at the top.','reps',1,10,NULL,2,20,NULL,3,30,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(23,3,3,'Jackknife Pull-ups','Use a bar with your feet supported in front of you so your arms and back learn the pull-up pattern. Reduce leg help as you get stronger.','reps',1,10,NULL,2,15,NULL,3,20,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(24,3,4,'Half Pull-ups','Work the top half of the pull-up range with clean reps. Avoid jerking and lower under control.','reps',1,8,NULL,2,11,NULL,2,15,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(25,3,5,'Full Pull-ups','Pull from a full hang until your chin clears the bar, then lower smoothly. Keep your body tight and avoid kipping.','reps',1,5,NULL,2,8,NULL,2,10,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(26,3,6,'Close Pull-ups','Use a closer grip to emphasize the arms and upper back. Pull through a full range and control the descent.','reps',1,5,NULL,2,8,NULL,2,10,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(27,3,7,'Uneven Pull-ups','Place one hand higher or farther from the center so one arm does more of the work. Keep the pull smooth and avoid twisting.','reps',1,5,NULL,2,7,NULL,2,9,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(28,3,8,'Half One-Arm Pull-ups','Practice one-arm pulling strength through a shortened range with the free arm offering minimal balance. Stay controlled at both ends.','reps',1,4,NULL,2,6,NULL,2,8,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(29,3,9,'Assisted One-Arm Pull-ups','Use the free hand or a light support to assist a one-arm pull-up pattern. Let the working arm do most of the pulling.','reps',1,3,NULL,2,5,NULL,2,7,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(30,3,10,'One-Arm Pull-ups','Perform strict one-arm pull-ups with no momentum. Start from a dead hang, pull cleanly, and lower with control.','reps',1,1,NULL,2,2,NULL,1,6,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(31,4,1,'Knee Tucks','Lie flat and draw your knees toward the chest without swinging. Lower back down under control.','reps',1,10,NULL,2,25,NULL,3,40,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(32,4,2,'Flat Knee Raises','Lie flat with bent knees and raise the thighs until the hips curl slightly. Move slowly and keep tension in the abs.','reps',1,10,NULL,2,20,NULL,3,35,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(33,4,3,'Flat Bent Leg Raises','Keep the legs bent and raise them from the hips while the lower back stays controlled. Do not rush the lowering phase.','reps',1,10,NULL,2,15,NULL,3,30,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(34,4,4,'Flat Frog Raises','Bring the soles together in a frog position and raise the legs using the abs. Focus on pelvic control rather than momentum.','reps',1,8,NULL,2,15,NULL,3,25,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(35,4,5,'Flat Straight Leg Raises','Keep the legs straight and raise them from the floor under control. Lower slowly without letting the back arch hard.','reps',1,5,NULL,2,10,NULL,2,20,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(36,4,6,'Hanging Knee Raises','Hang from a bar and lift the knees toward the chest without swinging. Pause briefly, then lower under control.','reps',1,5,NULL,2,10,NULL,2,15,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(37,4,7,'Hanging Bent Leg Raises','From a hang, raise bent legs higher than a simple knee raise while keeping the torso steady. Avoid using momentum.','reps',1,5,NULL,2,10,NULL,2,15,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(38,4,8,'Hanging Frog Raises','Use a frog-legged position from the hang and lift through the abs and hips. Keep the motion tight and controlled.','reps',1,5,NULL,2,10,NULL,2,15,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(39,4,9,'Partial Straight Leg Raises','From a hang, raise straight legs through a shortened range. Keep the shoulders packed and avoid swinging.','reps',1,5,NULL,2,10,NULL,2,15,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(40,4,10,'Hanging Straight Leg Raises','Raise straight legs from a dead hang until you reach your target height. Control both the lift and the lowering.','reps',1,5,NULL,2,10,NULL,2,30,NULL,NULL,2,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(41,5,1,'Short Bridges','Lie on your back with knees bent and lift the hips into a short bridge. Squeeze the glutes and lower smoothly.','reps',1,10,NULL,2,25,NULL,3,50,NULL,NULL,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(42,5,2,'Straight Bridges','Press through the feet and hands to lift into a straighter bridge position. Focus on opening the front of the hips and shoulders.','reps',1,10,NULL,2,20,NULL,3,40,NULL,NULL,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(43,5,3,'Angled Bridges','Use an angled setup so you can extend the hips and shoulders further than a short bridge. Move steadily and breathe through the position.','reps',1,8,NULL,2,15,NULL,3,30,NULL,NULL,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(44,5,4,'Head Bridges','Bridge onto the head with support from the hands and feet while keeping pressure controlled. Build comfort and strength gradually.','reps',1,8,NULL,2,15,NULL,2,25,NULL,NULL,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(45,5,5,'Half Bridges','Push into a deeper bridge with more back and shoulder extension than the earlier steps. Keep the motion smooth and avoid collapsing.','reps',1,8,NULL,2,10,NULL,2,20,NULL,NULL,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(46,5,6,'Full Bridges','Perform a full bridge from hands and feet with the hips lifted high. Work on even pressure through the arms and legs.','reps',1,6,NULL,2,6,NULL,2,15,NULL,NULL,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(47,5,7,'Wall Walking Down','Start standing, walk the hands down a wall into a bridge, and stop at a controllable depth. Move slowly and keep tension throughout.','reps',1,3,NULL,2,6,NULL,2,10,NULL,NULL,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(48,5,8,'Wall Walking Up','From the bottom of a wall walk, press and walk the hands back up the wall to standing. Stay patient and keep the spine active.','reps',1,2,NULL,2,4,NULL,2,6,NULL,NULL,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(49,5,9,'Closing Bridges','Work on narrowing the distance between hands and feet in the bridge. Open the shoulders and hips while keeping the movement controlled.','reps',1,2,NULL,2,4,NULL,2,6,NULL,NULL,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(50,5,10,'Stand-to-Stand Bridges','Lower from standing into a full bridge and return to standing under control. Use smooth whole-body tension, not a drop.','reps',1,1,NULL,2,3,NULL,2,10,30,NULL,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(51,6,1,'Wall Headstands','Set up a tripod headstand with light wall support and hold the position steadily. Stay braced through the shoulders and core.','seconds',NULL,NULL,30,NULL,NULL,60,NULL,NULL,NULL,120,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(52,6,2,'Crow Stands','Balance with knees on the upper arms and hands on the floor. Keep the gaze forward and shift weight carefully into the hands.','seconds',NULL,NULL,10,NULL,NULL,30,NULL,NULL,NULL,60,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(53,6,3,'Wall Handstands','Kick up to a wall-supported handstand and hold a straight line as well as you can. Press tall through the shoulders and keep the core tight.','seconds',NULL,NULL,30,NULL,NULL,60,NULL,NULL,NULL,120,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(54,6,4,'Half Handstand Push-ups','Use a partial range handstand press against the wall. Lower only as far as you can control and press back up smoothly.','reps',1,5,NULL,2,10,NULL,2,20,NULL,NULL,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(55,6,5,'Handstand Push-ups','Perform full-range wall handstand push-ups with control at the bottom and top. Keep the body tight and avoid crashing into the floor.','reps',1,5,NULL,2,10,NULL,2,15,NULL,NULL,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(56,6,6,'Close Handstand Push-ups','Bring the hands closer to make the press harder and more vertical. Stay stacked and control the descent.','reps',1,5,NULL,2,8,NULL,2,10,NULL,NULL,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(57,6,7,'Uneven Handstand Push-ups','Shift more load toward one arm while the other arm assists lightly. Keep the body aligned and move slowly.','reps',1,5,NULL,2,6,NULL,2,8,NULL,NULL,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(58,6,8,'Half One-Arm Handstand Push-ups','Work a one-arm handstand press through a shortened range with strict control. Use the free arm only as needed for balance.','reps',1,3,NULL,2,4,NULL,2,6,NULL,NULL,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(59,6,9,'Lever Handstand Push-ups','Use the free arm as a light lever while one arm handles most of the pressing load. Keep the shoulder packed and body tight.','reps',1,2,NULL,2,3,NULL,2,5,NULL,NULL,3,'2026-05-06 01:18:33','2026-05-06 07:36:25'),
(60,6,10,'One-Arm Handstand Push-ups','Perform a strict one-arm handstand push-up with full control and balance. Stay patient and avoid twisting through the trunk.','reps',1,1,NULL,2,2,NULL,1,5,NULL,NULL,3,'2026-05-06 01:18:33','2026-05-06 07:36:25');
/*!40000 ALTER TABLE `exercise_steps` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `exercises`
--

DROP TABLE IF EXISTS `exercises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `exercises` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(120) NOT NULL,
  `name` varchar(160) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_exercises_slug` (`slug`),
  UNIQUE KEY `uq_exercises_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exercises`
--

LOCK TABLES `exercises` WRITE;
/*!40000 ALTER TABLE `exercises` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `exercises` VALUES
(1,'push-ups','Push-ups','2026-05-06 01:18:33','2026-05-06 01:18:33'),
(2,'squats','Squats','2026-05-06 01:18:33','2026-05-06 01:18:33'),
(3,'pull-ups','Pull-ups','2026-05-06 01:18:33','2026-05-06 01:18:33'),
(4,'leg-raises','Leg Raises','2026-05-06 01:18:33','2026-05-06 01:18:33'),
(5,'bridges','Bridges','2026-05-06 01:18:33','2026-05-06 01:18:33'),
(6,'handstand-push-ups','Handstand Push-ups','2026-05-06 01:18:33','2026-05-06 01:18:33');
/*!40000 ALTER TABLE `exercises` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `knex_migrations`
--

DROP TABLE IF EXISTS `knex_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `knex_migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `batch` int(11) DEFAULT NULL,
  `migration_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `knex_migrations`
--

LOCK TABLES `knex_migrations` WRITE;
/*!40000 ALTER TABLE `knex_migrations` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `knex_migrations` VALUES
(1,'20260505154452_users-core-generic-initial-schema.cjs',1,'2026-05-05 15:45:58'),
(2,'20260505154452_users-core-profile-username-schema.cjs',1,'2026-05-05 15:45:58'),
(3,'20260505154508_console-core-generic-initial-schema.cjs',1,'2026-05-05 15:45:58'),
(9,'20260506080853_crud-initial-schema-exercises.cjs',2,'2026-05-07 02:18:45'),
(10,'20260506081316_crud-initial-schema-exercise_steps.cjs',2,'2026-05-07 02:18:45'),
(11,'20260506081333_crud-initial-schema-user_program_assignments.cjs',2,'2026-05-07 02:18:45'),
(12,'20260506081334_crud-initial-schema-personal_step_variations.cjs',2,'2026-05-07 02:18:45'),
(13,'20260506081335_crud-initial-schema-user_exercise_progress.cjs',2,'2026-05-07 02:18:45'),
(14,'20260506081336_crud-initial-schema-workout_occurrences.cjs',2,'2026-05-07 02:18:45'),
(15,'20260506114854_crud-initial-schema-program_templates.cjs',2,'2026-05-07 02:18:45'),
(16,'20260506114945_crud-initial-schema-program_template_schedule_entries.cjs',2,'2026-05-07 02:18:45'),
(17,'20260506115011_crud-initial-schema-programs.cjs',2,'2026-05-07 02:18:45'),
(18,'20260506115022_crud-initial-schema-program_schedule_entries.cjs',2,'2026-05-07 02:18:45'),
(19,'20260506115034_crud-initial-schema-user_program_assignment_revisions.cjs',2,'2026-05-07 02:18:45'),
(20,'20260506115043_crud-initial-schema-workout_occurrence_exercises.cjs',2,'2026-05-07 02:18:45'),
(21,'20260506115052_crud-initial-schema-workout_set_logs.cjs',2,'2026-05-07 02:18:45'),
(22,'20260507120000_workout_set_logs_drop_set_number.cjs',3,'2026-05-07 02:19:15');
/*!40000 ALTER TABLE `knex_migrations` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `knex_migrations_lock`
--

DROP TABLE IF EXISTS `knex_migrations_lock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `knex_migrations_lock` (
  `index` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `is_locked` int(11) DEFAULT NULL,
  PRIMARY KEY (`index`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `knex_migrations_lock`
--

LOCK TABLES `knex_migrations_lock` WRITE;
/*!40000 ALTER TABLE `knex_migrations_lock` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `knex_migrations_lock` VALUES
(1,0);
/*!40000 ALTER TABLE `knex_migrations_lock` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `personal_step_variations`
--

DROP TABLE IF EXISTS `personal_step_variations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_step_variations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `canonical_step_id` bigint(20) unsigned NOT NULL,
  `name` varchar(160) NOT NULL,
  `measurement_unit` varchar(16) NOT NULL DEFAULT 'reps',
  `reason` varchar(160) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_personal_step_variations_user_id` (`user_id`),
  KEY `idx_personal_step_variations_canonical_step_id` (`canonical_step_id`),
  KEY `idx_personal_step_variations_user_step_status` (`user_id`,`canonical_step_id`,`status`),
  CONSTRAINT `fk_personal_step_variations_canonical_step_id` FOREIGN KEY (`canonical_step_id`) REFERENCES `exercise_steps` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_personal_step_variations_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_step_variations`
--

LOCK TABLES `personal_step_variations` WRITE;
/*!40000 ALTER TABLE `personal_step_variations` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `personal_step_variations` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `program_schedule_entries`
--

DROP TABLE IF EXISTS `program_schedule_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `program_schedule_entries` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `program_id` bigint(20) unsigned NOT NULL,
  `day_of_week` tinyint(3) unsigned NOT NULL,
  `slot_number` tinyint(3) unsigned NOT NULL DEFAULT 1,
  `exercise_id` bigint(20) unsigned NOT NULL,
  `work_sets_min` tinyint(3) unsigned NOT NULL,
  `work_sets_max` tinyint(3) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_program_schedule_entries_program_day_slot` (`program_id`,`day_of_week`,`slot_number`),
  UNIQUE KEY `uq_program_schedule_entries_program_day_exercise` (`program_id`,`day_of_week`,`exercise_id`),
  KEY `idx_program_schedule_entries_program_id` (`program_id`),
  KEY `idx_program_schedule_entries_exercise_id` (`exercise_id`),
  KEY `idx_program_schedule_entries_program_day` (`program_id`,`day_of_week`),
  KEY `idx_program_schedule_entries_user_id` (`user_id`),
  CONSTRAINT `fk_program_schedule_entries_exercise_id` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`),
  CONSTRAINT `fk_program_schedule_entries_program_id` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_program_schedule_entries_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6679 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `program_schedule_entries`
--

LOCK TABLES `program_schedule_entries` WRITE;
/*!40000 ALTER TABLE `program_schedule_entries` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `program_schedule_entries` VALUES
(6457,7,609,1,1,3,10,50,'2026-05-09 00:26:08','2026-05-09 00:26:08'),
(6458,7,609,1,2,2,10,50,'2026-05-09 00:26:08','2026-05-09 00:26:08'),
(6459,7,609,2,1,1,10,50,'2026-05-09 00:26:08','2026-05-09 00:26:08'),
(6460,7,609,2,2,4,10,50,'2026-05-09 00:26:08','2026-05-09 00:26:08'),
(6461,7,609,3,1,6,10,50,'2026-05-09 00:26:08','2026-05-09 00:26:08'),
(6462,7,609,3,2,5,10,50,'2026-05-09 00:26:08','2026-05-09 00:26:08'),
(6463,7,609,4,1,3,10,50,'2026-05-09 00:26:08','2026-05-09 00:26:08'),
(6464,7,609,4,2,2,10,50,'2026-05-09 00:26:08','2026-05-09 00:26:08'),
(6465,7,609,5,1,1,10,50,'2026-05-09 00:26:08','2026-05-09 00:26:08'),
(6466,7,609,5,2,4,10,50,'2026-05-09 00:26:08','2026-05-09 00:26:08'),
(6467,7,609,6,1,6,10,50,'2026-05-09 00:26:08','2026-05-09 00:26:08'),
(6468,7,609,6,2,5,10,50,'2026-05-09 00:26:08','2026-05-09 00:26:08'),
(6649,3,622,1,1,3,10,50,'2026-05-09 01:48:11','2026-05-09 01:48:11'),
(6650,3,622,1,2,2,10,50,'2026-05-09 01:48:11','2026-05-09 01:48:11'),
(6651,3,622,2,1,1,10,50,'2026-05-09 01:48:11','2026-05-09 01:48:11'),
(6652,3,622,2,2,4,10,50,'2026-05-09 01:48:11','2026-05-09 01:48:11'),
(6653,3,622,3,1,6,10,50,'2026-05-09 01:48:11','2026-05-09 01:48:11'),
(6654,3,622,3,2,5,10,50,'2026-05-09 01:48:11','2026-05-09 01:48:11'),
(6655,3,622,4,1,3,10,50,'2026-05-09 01:48:11','2026-05-09 01:48:11'),
(6656,3,622,4,2,2,10,50,'2026-05-09 01:48:11','2026-05-09 01:48:11'),
(6657,3,622,5,1,1,10,50,'2026-05-09 01:48:11','2026-05-09 01:48:11'),
(6658,3,622,5,2,4,10,50,'2026-05-09 01:48:11','2026-05-09 01:48:11'),
(6659,3,622,6,1,6,10,50,'2026-05-09 01:48:11','2026-05-09 01:48:11'),
(6660,3,622,6,2,5,10,50,'2026-05-09 01:48:11','2026-05-09 01:48:11'),
(6664,16,623,1,1,3,10,50,'2026-05-09 01:48:13','2026-05-09 01:48:13'),
(6665,16,623,1,2,2,10,50,'2026-05-09 01:48:13','2026-05-09 01:48:13'),
(6666,16,623,2,1,1,10,50,'2026-05-09 01:48:13','2026-05-09 01:48:13'),
(6667,16,623,2,2,4,10,50,'2026-05-09 01:48:13','2026-05-09 01:48:13'),
(6668,16,623,3,1,6,10,50,'2026-05-09 01:48:13','2026-05-09 01:48:13'),
(6669,16,623,3,2,5,10,50,'2026-05-09 01:48:13','2026-05-09 01:48:13'),
(6670,16,623,4,1,3,10,50,'2026-05-09 01:48:13','2026-05-09 01:48:13'),
(6671,16,623,4,2,2,10,50,'2026-05-09 01:48:13','2026-05-09 01:48:13'),
(6672,16,623,5,1,1,10,50,'2026-05-09 01:48:13','2026-05-09 01:48:13'),
(6673,16,623,5,2,4,10,50,'2026-05-09 01:48:13','2026-05-09 01:48:13'),
(6674,16,623,6,1,6,10,50,'2026-05-09 01:48:13','2026-05-09 01:48:13'),
(6675,16,623,6,2,5,10,50,'2026-05-09 01:48:13','2026-05-09 01:48:13');
/*!40000 ALTER TABLE `program_schedule_entries` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `program_template_schedule_entries`
--

DROP TABLE IF EXISTS `program_template_schedule_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `program_template_schedule_entries` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `program_template_id` bigint(20) unsigned NOT NULL,
  `day_of_week` tinyint(3) unsigned NOT NULL,
  `slot_number` tinyint(3) unsigned NOT NULL DEFAULT 1,
  `exercise_id` bigint(20) unsigned NOT NULL,
  `work_sets_min` tinyint(3) unsigned NOT NULL,
  `work_sets_max` tinyint(3) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_program_template_schedule_entries_program_day_slot` (`program_template_id`,`day_of_week`,`slot_number`),
  UNIQUE KEY `uq_program_template_schedule_entries_program_day_exercise` (`program_template_id`,`day_of_week`,`exercise_id`),
  KEY `idx_program_template_schedule_entries_program_id` (`program_template_id`),
  KEY `idx_program_template_schedule_entries_exercise_id` (`exercise_id`),
  KEY `idx_program_template_schedule_entries_program_day` (`program_template_id`,`day_of_week`),
  CONSTRAINT `fk_program_template_schedule_entries_exercise_id` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`),
  CONSTRAINT `fk_program_template_schedule_entries_program_id` FOREIGN KEY (`program_template_id`) REFERENCES `program_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `program_template_schedule_entries`
--

LOCK TABLES `program_template_schedule_entries` WRITE;
/*!40000 ALTER TABLE `program_template_schedule_entries` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `program_template_schedule_entries` VALUES
(1,1,1,1,1,2,3,'2026-05-06 01:48:47','2026-05-06 01:48:47'),
(2,1,1,2,4,2,3,'2026-05-06 01:48:47','2026-05-06 01:48:47'),
(3,1,5,1,3,2,3,'2026-05-06 01:48:47','2026-05-06 01:48:47'),
(4,1,5,2,2,2,3,'2026-05-06 01:48:47','2026-05-06 01:48:47'),
(5,2,1,1,1,2,2,'2026-05-06 01:48:47','2026-05-06 01:48:47'),
(6,2,1,2,4,2,2,'2026-05-06 01:48:47','2026-05-06 01:48:47'),
(7,2,3,1,3,2,2,'2026-05-06 01:48:47','2026-05-06 01:48:47'),
(8,2,3,2,2,2,2,'2026-05-06 01:48:47','2026-05-06 01:48:47'),
(9,2,5,1,6,2,2,'2026-05-06 01:48:47','2026-05-06 01:48:47'),
(10,2,5,2,5,2,2,'2026-05-06 01:48:47','2026-05-06 01:48:47'),
(11,3,1,1,3,2,3,'2026-05-06 01:48:47','2026-05-06 01:48:47'),
(12,3,2,1,5,2,3,'2026-05-06 01:48:47','2026-05-06 01:48:47'),
(13,3,3,1,6,2,3,'2026-05-06 01:48:47','2026-05-06 01:48:47'),
(14,3,4,1,4,2,3,'2026-05-06 01:48:47','2026-05-06 01:48:47'),
(15,3,5,1,2,2,3,'2026-05-06 01:48:47','2026-05-06 01:48:47'),
(16,3,6,1,1,2,3,'2026-05-06 01:48:47','2026-05-06 01:48:47'),
(17,4,1,1,3,10,50,'2026-05-06 01:52:08','2026-05-06 01:52:08'),
(18,4,1,2,2,10,50,'2026-05-06 01:52:08','2026-05-06 01:52:08'),
(19,4,2,1,1,10,50,'2026-05-06 01:52:08','2026-05-06 01:52:08'),
(20,4,2,2,4,10,50,'2026-05-06 01:52:08','2026-05-06 01:52:08'),
(21,4,3,1,6,10,50,'2026-05-06 01:52:08','2026-05-06 01:52:08'),
(22,4,3,2,5,10,50,'2026-05-06 01:52:08','2026-05-06 01:52:08'),
(23,4,4,1,3,10,50,'2026-05-06 01:52:08','2026-05-06 01:52:08'),
(24,4,4,2,2,10,50,'2026-05-06 01:52:08','2026-05-06 01:52:08'),
(25,4,5,1,1,10,50,'2026-05-06 01:52:08','2026-05-06 01:52:08'),
(26,4,5,2,4,10,50,'2026-05-06 01:52:08','2026-05-06 01:52:08'),
(27,4,6,1,6,10,50,'2026-05-06 01:52:08','2026-05-06 01:52:08'),
(28,4,6,2,5,10,50,'2026-05-06 01:52:08','2026-05-06 01:52:08');
/*!40000 ALTER TABLE `program_template_schedule_entries` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `program_templates`
--

DROP TABLE IF EXISTS `program_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `program_templates` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(120) NOT NULL,
  `name` varchar(160) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_program_templates_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `program_templates`
--

LOCK TABLES `program_templates` WRITE;
/*!40000 ALTER TABLE `program_templates` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `program_templates` VALUES
(1,'new-blood','New Blood','Canonical Convict Conditioning template: Monday push-ups and leg raises; Friday pull-ups and squats.','2026-05-06 01:48:47','2026-05-06 01:48:47'),
(2,'good-behavior','Good Behavior','Canonical Convict Conditioning template: Monday push-ups and leg raises; Wednesday pull-ups and squats; Friday handstand push-ups and bridges.','2026-05-06 01:48:47','2026-05-06 01:48:47'),
(3,'veterano','Veterano','Canonical Convict Conditioning template: six-day rotation with one exercise family per day.','2026-05-06 01:48:47','2026-05-06 01:48:47'),
(4,'supermax','Supermax','Canonical Convict Conditioning template: Monday/Thursday pull-ups and squats; Tuesday/Friday push-ups and leg raises; Wednesday/Saturday handstand push-ups and bridges.','2026-05-06 01:52:08','2026-05-06 01:52:08');
/*!40000 ALTER TABLE `program_templates` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `programs`
--

DROP TABLE IF EXISTS `programs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `programs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `program_template_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(160) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_programs_user_id` (`user_id`),
  KEY `idx_programs_program_template_id` (`program_template_id`),
  CONSTRAINT `fk_programs_program_template_id` FOREIGN KEY (`program_template_id`) REFERENCES `program_templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_programs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=624 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `programs`
--

LOCK TABLES `programs` WRITE;
/*!40000 ALTER TABLE `programs` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `programs` VALUES
(609,7,4,'Supermax','Canonical Convict Conditioning template: Monday/Thursday pull-ups and squats; Tuesday/Friday push-ups and leg raises; Wednesday/Saturday handstand push-ups and bridges.','2026-05-09 00:26:08','2026-05-09 00:26:08'),
(622,3,4,'Supermax','Canonical Convict Conditioning template: Monday/Thursday pull-ups and squats; Tuesday/Friday push-ups and leg raises; Wednesday/Saturday handstand push-ups and bridges.','2026-05-09 01:48:11','2026-05-09 01:48:11'),
(623,16,4,'Supermax','Canonical Convict Conditioning template: Monday/Thursday pull-ups and squats; Tuesday/Friday push-ups and leg raises; Wednesday/Saturday handstand push-ups and bridges.','2026-05-09 01:48:13','2026-05-09 01:48:13');
/*!40000 ALTER TABLE `programs` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `user_exercise_progress`
--

DROP TABLE IF EXISTS `user_exercise_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_exercise_progress` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `exercise_id` bigint(20) unsigned NOT NULL,
  `current_step_id` bigint(20) unsigned NOT NULL,
  `ready_to_advance_step_id` bigint(20) unsigned DEFAULT NULL,
  `active_variation_id` bigint(20) unsigned DEFAULT NULL,
  `ready_to_advance_at` timestamp NULL DEFAULT NULL,
  `last_completed_occurrence_id` bigint(20) unsigned DEFAULT NULL,
  `last_completed_at` timestamp NULL DEFAULT NULL,
  `stall_count` smallint(5) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_exercise_progress_user_exercise` (`user_id`,`exercise_id`),
  KEY `idx_user_exercise_progress_current_step_id` (`current_step_id`),
  KEY `idx_user_exercise_progress_ready_step_id` (`ready_to_advance_step_id`),
  KEY `fk_user_exercise_progress_exercise_id` (`exercise_id`),
  KEY `fk_user_exercise_progress_active_variation_id` (`active_variation_id`),
  KEY `fk_user_exercise_progress_last_completed_occurrence_id` (`last_completed_occurrence_id`),
  CONSTRAINT `fk_user_exercise_progress_active_variation_id` FOREIGN KEY (`active_variation_id`) REFERENCES `personal_step_variations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_user_exercise_progress_current_step_id` FOREIGN KEY (`current_step_id`) REFERENCES `exercise_steps` (`id`),
  CONSTRAINT `fk_user_exercise_progress_exercise_id` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_exercise_progress_last_completed_occurrence_id` FOREIGN KEY (`last_completed_occurrence_id`) REFERENCES `workout_occurrences` (`id`),
  CONSTRAINT `fk_user_exercise_progress_ready_to_advance_step_id` FOREIGN KEY (`ready_to_advance_step_id`) REFERENCES `exercise_steps` (`id`),
  CONSTRAINT `fk_user_exercise_progress_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=396 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_exercise_progress`
--

LOCK TABLES `user_exercise_progress` WRITE;
/*!40000 ALTER TABLE `user_exercise_progress` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `user_exercise_progress` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `user_program_assignment_revisions`
--

DROP TABLE IF EXISTS `user_program_assignment_revisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_program_assignment_revisions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_program_assignment_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `program_id` bigint(20) unsigned NOT NULL,
  `effective_from_date` date NOT NULL,
  `change_reason` varchar(64) NOT NULL DEFAULT 'initial',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_program_assignment_revisions_assignment_effective_date` (`user_program_assignment_id`,`effective_from_date`),
  KEY `idx_user_program_assignment_revisions_assignment_effective_date` (`user_program_assignment_id`,`effective_from_date`),
  KEY `idx_user_program_assignment_revisions_program_id` (`program_id`),
  KEY `idx_user_program_assignment_revisions_user_id` (`user_id`),
  CONSTRAINT `fk_user_program_assignment_revisions_assignment_id` FOREIGN KEY (`user_program_assignment_id`) REFERENCES `user_program_assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_program_assignment_revisions_program_id` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`),
  CONSTRAINT `fk_user_program_assignment_revisions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=620 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_program_assignment_revisions`
--

LOCK TABLES `user_program_assignment_revisions` WRITE;
/*!40000 ALTER TABLE `user_program_assignment_revisions` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `user_program_assignment_revisions` VALUES
(605,605,7,609,'2026-05-09','initial',NULL,'2026-05-09 00:26:08'),
(618,618,3,622,'2026-05-05','initial',NULL,'2026-05-09 01:48:11'),
(619,619,16,623,'2026-05-05','initial',NULL,'2026-05-09 01:48:13');
/*!40000 ALTER TABLE `user_program_assignment_revisions` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `user_program_assignments`
--

DROP TABLE IF EXISTS `user_program_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_program_assignments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `starts_on` date NOT NULL,
  `ends_on` date DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_program_assignments_user_id` (`user_id`),
  KEY `idx_user_program_assignments_user_status` (`user_id`,`status`),
  CONSTRAINT `fk_user_program_assignments_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=620 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_program_assignments`
--

LOCK TABLES `user_program_assignments` WRITE;
/*!40000 ALTER TABLE `user_program_assignments` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `user_program_assignments` VALUES
(605,7,'2026-05-09',NULL,'active','2026-05-09 00:26:08','2026-05-09 00:26:08'),
(618,3,'2026-05-05',NULL,'active','2026-05-09 01:48:11','2026-05-09 01:48:11'),
(619,16,'2026-05-05',NULL,'active','2026-05-09 01:48:13','2026-05-09 01:48:13');
/*!40000 ALTER TABLE `user_program_assignments` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `user_settings`
--

DROP TABLE IF EXISTS `user_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_settings` (
  `user_id` bigint(20) unsigned NOT NULL,
  `theme` varchar(32) NOT NULL DEFAULT 'system',
  `locale` varchar(24) NOT NULL DEFAULT 'en',
  `time_zone` varchar(64) NOT NULL DEFAULT 'UTC',
  `date_format` varchar(32) NOT NULL DEFAULT 'yyyy-mm-dd',
  `number_format` varchar(32) NOT NULL DEFAULT '1,234.56',
  `currency_code` varchar(3) NOT NULL DEFAULT 'USD',
  `avatar_size` int(11) NOT NULL DEFAULT 64,
  `password_sign_in_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `password_setup_required` tinyint(1) NOT NULL DEFAULT 0,
  `notify_product_updates` tinyint(1) NOT NULL DEFAULT 1,
  `notify_account_activity` tinyint(1) NOT NULL DEFAULT 1,
  `notify_security_alerts` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_settings_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_settings`
--

LOCK TABLES `user_settings` WRITE;
/*!40000 ALTER TABLE `user_settings` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `user_settings` VALUES
(1,'system','en','UTC','yyyy-mm-dd','1,234.56','USD',64,1,0,1,1,1,'2026-05-06 23:27:05','2026-05-06 23:27:05'),
(2,'system','en','UTC','yyyy-mm-dd','1,234.56','USD',64,1,0,1,1,1,'2026-05-06 23:27:08','2026-05-06 23:27:08'),
(3,'system','en','UTC','yyyy-mm-dd','1,234.56','USD',64,1,0,1,1,1,'2026-05-06 23:27:14','2026-05-06 23:27:14'),
(4,'system','en','UTC','yyyy-mm-dd','1,234.56','USD',64,1,0,1,1,1,'2026-05-06 23:27:19','2026-05-06 23:27:19'),
(7,'light','en','UTC','yyyy-mm-dd','1,234.56','USD',64,1,0,1,1,1,'2026-05-06 23:17:26','2026-05-08 00:58:55'),
(9,'system','en','UTC','yyyy-mm-dd','1,234.56','USD',64,1,0,1,1,1,'2026-05-06 23:51:59','2026-05-06 23:51:59'),
(10,'system','en','UTC','yyyy-mm-dd','1,234.56','USD',64,1,0,1,1,1,'2026-05-07 01:15:15','2026-05-07 01:15:15'),
(11,'system','en','UTC','yyyy-mm-dd','1,234.56','USD',64,1,0,1,1,1,'2026-05-07 01:34:09','2026-05-07 01:34:09'),
(12,'system','en','UTC','yyyy-mm-dd','1,234.56','USD',64,1,0,1,1,1,'2026-05-07 02:40:46','2026-05-07 02:40:46'),
(13,'system','en','UTC','yyyy-mm-dd','1,234.56','USD',64,1,0,1,1,1,'2026-05-08 14:26:16','2026-05-08 14:26:16'),
(14,'system','en','UTC','yyyy-mm-dd','1,234.56','USD',64,1,0,1,1,1,'2026-05-08 16:02:58','2026-05-08 16:02:58'),
(15,'system','en','UTC','yyyy-mm-dd','1,234.56','USD',64,1,0,1,1,1,'2026-05-09 01:41:37','2026-05-09 01:41:37'),
(16,'system','en','UTC','yyyy-mm-dd','1,234.56','USD',64,1,0,1,1,1,'2026-05-09 01:43:02','2026-05-09 01:43:02');
/*!40000 ALTER TABLE `user_settings` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `auth_provider` varchar(64) NOT NULL,
  `auth_provider_user_sid` varchar(191) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(120) NOT NULL,
  `display_name` varchar(160) NOT NULL,
  `avatar_storage_key` varchar(512) DEFAULT NULL,
  `avatar_version` varchar(64) DEFAULT NULL,
  `avatar_updated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_identity` (`auth_provider`,`auth_provider_user_sid`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `users` VALUES
(1,'supabase','playwright-slice1-playwright','slice1-playwright@convict.local','slice1-playwright','Slice 1 Playwright',NULL,NULL,NULL,'2026-05-06 13:40:45'),
(2,'supabase','playwright-slice2-playwright','slice2-playwright@convict.local','slice2-playwright','Slice 2 Playwright',NULL,NULL,NULL,'2026-05-06 13:40:48'),
(3,'supabase','playwright-slice3-playwright','slice3-playwright@convict.local','slice3-playwright','Slice 3 Playwright',NULL,NULL,NULL,'2026-05-06 13:40:55'),
(4,'supabase','playwright-slice4-playwright','slice4-playwright@convict.local','slice4-playwright','Slice 4 Playwright',NULL,NULL,NULL,'2026-05-06 13:40:59'),
(5,'supabase','playwright-manual-flow','manual-flow@convict.local','manual-flow','Manual Flow Workspace',NULL,NULL,NULL,'2026-05-06 13:41:39'),
(6,'supabase','playwright-manual-e2e','manual-e2e@convict.local','manual-e2e','Manual E2E',NULL,NULL,NULL,'2026-05-06 13:43:33'),
(7,'supabase','6009e2e3-062a-486f-829b-73e9928bf66d','tonymobily@gmail.com','tonymobily','tonymobily',NULL,NULL,NULL,'2026-05-06 06:44:12'),
(9,'supabase','playwright-progress-playwright','progress-playwright@convict.local','progress-playwright','Progress Playwright',NULL,NULL,NULL,'2026-05-06 23:51:58'),
(10,'supabase','playwright-surfaces-playwright','surfaces-playwright@convict.local','surfaces-playwright','Surfaces Playwright',NULL,NULL,NULL,'2026-05-07 01:15:15'),
(11,'supabase','playwright-surface-routes-playwright','surface-routes-playwright@convict.local','surface-routes-playwright','Surface Routes Playwright',NULL,NULL,NULL,'2026-05-07 01:34:08'),
(12,'supabase','playwright-history-playwright','history-playwright@convict.local','history-playwright','History Playwright',NULL,NULL,NULL,'2026-05-07 02:40:45'),
(13,'supabase','playwright-adaptive-shell-playwright','adaptive-shell-playwright@convict.local','adaptive-shell-playwright','Adaptive Shell Playwright',NULL,NULL,NULL,'2026-05-08 14:26:15'),
(14,'supabase','playwright-ui-review','ui-review@convict.local','ui-review','UI Review',NULL,NULL,NULL,'2026-05-08 16:02:29'),
(15,'supabase','playwright-convict-conditioning-playwright','convict-conditioning-playwright@convict.local','convict-conditioning-playwright','Convict Conditioning Playwright',NULL,NULL,NULL,'2026-05-09 01:41:36'),
(16,'supabase','playwright-slice3-live-sync','slice3-live-sync@convict.local','slice3-live-sync','Slice 3 Live Sync',NULL,NULL,NULL,'2026-05-09 01:43:02');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `workout_occurrence_exercises`
--

DROP TABLE IF EXISTS `workout_occurrence_exercises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `workout_occurrence_exercises` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `workout_occurrence_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `slot_number` smallint(5) unsigned NOT NULL,
  `exercise_id` bigint(20) unsigned NOT NULL,
  `exercise_name_snapshot` varchar(160) NOT NULL,
  `canonical_step_id` bigint(20) unsigned NOT NULL,
  `canonical_step_name_snapshot` varchar(160) NOT NULL,
  `personal_step_variation_id` bigint(20) unsigned DEFAULT NULL,
  `variation_name_snapshot` varchar(160) DEFAULT NULL,
  `measurement_unit_snapshot` varchar(16) NOT NULL,
  `planned_work_sets_min` smallint(5) unsigned NOT NULL,
  `planned_work_sets_max` smallint(5) unsigned NOT NULL,
  `progression_sets_snapshot` smallint(5) unsigned DEFAULT NULL,
  `progression_reps_min_snapshot` smallint(5) unsigned DEFAULT NULL,
  `progression_reps_max_snapshot` smallint(5) unsigned DEFAULT NULL,
  `progression_seconds_snapshot` smallint(5) unsigned DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_workout_occurrence_exercises_occurrence_slot` (`workout_occurrence_id`,`slot_number`),
  UNIQUE KEY `uq_workout_occurrence_exercises_occurrence_exercise` (`workout_occurrence_id`,`exercise_id`),
  KEY `idx_workout_occurrence_exercises_exercise_id` (`exercise_id`),
  KEY `idx_workout_occurrence_exercises_canonical_step_id` (`canonical_step_id`),
  KEY `fk_workout_occurrence_exercises_personal_step_variation_id` (`personal_step_variation_id`),
  KEY `idx_workout_occurrence_exercises_user_id` (`user_id`),
  CONSTRAINT `fk_workout_occurrence_exercises_canonical_step_id` FOREIGN KEY (`canonical_step_id`) REFERENCES `exercise_steps` (`id`),
  CONSTRAINT `fk_workout_occurrence_exercises_exercise_id` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`),
  CONSTRAINT `fk_workout_occurrence_exercises_occurrence_id` FOREIGN KEY (`workout_occurrence_id`) REFERENCES `workout_occurrences` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_workout_occurrence_exercises_personal_step_variation_id` FOREIGN KEY (`personal_step_variation_id`) REFERENCES `personal_step_variations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_workout_occurrence_exercises_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1224 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workout_occurrence_exercises`
--

LOCK TABLES `workout_occurrence_exercises` WRITE;
/*!40000 ALTER TABLE `workout_occurrence_exercises` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `workout_occurrence_exercises` VALUES
(1194,601,7,1,6,'Handstand Push-ups',51,'Wall Headstands',NULL,NULL,'seconds',10,50,NULL,NULL,NULL,120,'pending',NULL,'2026-05-09 00:26:23','2026-05-09 00:26:23'),
(1195,601,7,2,5,'Bridges',41,'Short Bridges',NULL,NULL,'reps',10,50,3,50,NULL,NULL,'pending',NULL,'2026-05-09 00:26:23','2026-05-09 00:26:23'),
(1220,614,3,1,6,'Handstand Push-ups',51,'Wall Headstands',NULL,NULL,'seconds',10,50,NULL,NULL,NULL,120,'pending',NULL,'2026-05-09 01:48:12','2026-05-09 01:48:12'),
(1221,614,3,2,5,'Bridges',41,'Short Bridges',NULL,NULL,'reps',10,50,3,50,NULL,NULL,'pending',NULL,'2026-05-09 01:48:12','2026-05-09 01:48:12'),
(1222,615,16,1,6,'Handstand Push-ups',51,'Wall Headstands',NULL,NULL,'seconds',10,50,NULL,NULL,NULL,120,'pending',NULL,'2026-05-09 01:48:14','2026-05-09 01:48:14'),
(1223,615,16,2,5,'Bridges',41,'Short Bridges',NULL,NULL,'reps',10,50,3,50,NULL,NULL,'pending',NULL,'2026-05-09 01:48:14','2026-05-09 01:48:14');
/*!40000 ALTER TABLE `workout_occurrence_exercises` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `workout_occurrences`
--

DROP TABLE IF EXISTS `workout_occurrences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `workout_occurrences` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `user_program_assignment_id` bigint(20) unsigned NOT NULL,
  `user_program_assignment_revision_id` bigint(20) unsigned NOT NULL,
  `scheduled_for_date` date NOT NULL,
  `performed_on_date` date DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'in_progress',
  `started_at` timestamp NULL DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `definitely_missed_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_workout_occurrences_assignment_scheduled_date` (`user_program_assignment_id`,`scheduled_for_date`),
  KEY `idx_workout_occurrences_user_id` (`user_id`),
  KEY `idx_workout_occurrences_user_scheduled_date` (`user_id`,`scheduled_for_date`),
  KEY `idx_workout_occurrences_user_performed_date` (`user_id`,`performed_on_date`),
  KEY `idx_workout_occurrences_revision_scheduled_date` (`user_program_assignment_revision_id`,`scheduled_for_date`),
  CONSTRAINT `fk_workout_occurrences_assignment_id` FOREIGN KEY (`user_program_assignment_id`) REFERENCES `user_program_assignments` (`id`),
  CONSTRAINT `fk_workout_occurrences_assignment_revision_id` FOREIGN KEY (`user_program_assignment_revision_id`) REFERENCES `user_program_assignment_revisions` (`id`),
  CONSTRAINT `fk_workout_occurrences_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=616 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workout_occurrences`
--

LOCK TABLES `workout_occurrences` WRITE;
/*!40000 ALTER TABLE `workout_occurrences` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `workout_occurrences` VALUES
(601,7,605,605,'2026-05-09','2026-05-09','in_progress','2026-05-09 00:26:23',NULL,NULL,NULL,'2026-05-09 00:26:23','2026-05-09 00:26:23'),
(614,3,618,618,'2026-05-06','2026-05-09','in_progress','2026-05-09 01:48:12',NULL,NULL,NULL,'2026-05-09 01:48:12','2026-05-09 01:48:12'),
(615,16,619,619,'2026-05-06','2026-05-09','in_progress','2026-05-09 01:48:14',NULL,NULL,NULL,'2026-05-09 01:48:14','2026-05-09 01:48:14');
/*!40000 ALTER TABLE `workout_occurrences` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `workout_set_logs`
--

DROP TABLE IF EXISTS `workout_set_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `workout_set_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `workout_occurrence_exercise_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `side` varchar(16) NOT NULL DEFAULT 'both',
  `measurement_unit_snapshot` varchar(16) NOT NULL,
  `performed_value` smallint(5) unsigned NOT NULL,
  `qualifies_for_progression` tinyint(1) NOT NULL DEFAULT 0,
  `logged_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_workout_set_logs_logged_at` (`logged_at`),
  KEY `idx_workout_set_logs_user_id` (`user_id`),
  KEY `idx_workout_set_logs_occurrence_exercise_id` (`workout_occurrence_exercise_id`),
  CONSTRAINT `fk_workout_set_logs_occurrence_exercise_id` FOREIGN KEY (`workout_occurrence_exercise_id`) REFERENCES `workout_occurrence_exercises` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_workout_set_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1273 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workout_set_logs`
--

LOCK TABLES `workout_set_logs` WRITE;
/*!40000 ALTER TABLE `workout_set_logs` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `workout_set_logs` VALUES
(1233,1194,7,'both','seconds',100,0,'2026-05-09 00:27:32','2026-05-09 00:27:32','2026-05-09 00:27:32'),
(1234,1194,7,'both','seconds',122,0,'2026-05-09 00:56:36','2026-05-09 00:56:36','2026-05-08 23:37:57'),
(1266,1220,3,'both','seconds',35,0,'2026-05-09 01:48:12','2026-05-09 01:48:12','2026-05-09 01:48:12'),
(1268,1220,3,'both','seconds',55,0,'2026-05-09 01:48:13','2026-05-09 01:48:13','2026-05-09 01:48:13'),
(1269,1220,3,'both','seconds',65,0,'2026-05-09 01:48:13','2026-05-09 01:48:13','2026-05-09 01:48:13'),
(1270,1222,16,'both','seconds',37,0,'2026-05-09 01:48:15','2026-05-09 01:48:15','2026-05-09 01:48:15'),
(1271,1222,16,'both','seconds',41,0,'2026-05-09 01:48:15','2026-05-09 01:48:15','2026-05-09 01:48:15');
/*!40000 ALTER TABLE `workout_set_logs` ENABLE KEYS */;
UNLOCK TABLES;
commit;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-05-09 23:17:17
