/* eslint-disable max-len */
const EXERCISES = JSON.parse(String.raw`[{"slug": "push-ups", "name": "Push-ups"},{"slug": "squats", "name": "Squats"},{"slug": "pull-ups", "name": "Pull-ups"},{"slug": "leg-raises", "name": "Leg Raises"},{"slug": "bridges", "name": "Bridges"},{"slug": "handstand-push-ups", "name": "Handstand Push-ups"}]`);

const PROGRAMS = JSON.parse(String.raw`[{"slug": "new-blood", "name": "New Blood", "description": "Canonical Convict Conditioning template: Monday push-ups and leg raises; Friday pull-ups and squats.", "visibility": "system"},{"slug": "good-behavior", "name": "Good Behavior", "description": "Canonical Convict Conditioning template: Monday push-ups and leg raises; Wednesday pull-ups and squats; Friday handstand push-ups and bridges.", "visibility": "system"},{"slug": "veterano", "name": "Veterano", "description": "Canonical Convict Conditioning template: six-day rotation with one exercise family per day.", "visibility": "system"},{"slug": "supermax", "name": "Supermax", "description": "Canonical Convict Conditioning template: Monday/Thursday pull-ups and squats; Tuesday/Friday push-ups and leg raises; Wednesday/Saturday handstand push-ups and bridges.", "visibility": "system"}]`);

const EXERCISE_STEPS = JSON.parse(String.raw`[{"exercise_slug": "push-ups", "step_number": 1, "step_name": "Wall Push-ups", "instruction_text": "Stand facing a wall and press your body away from the wall with straight-body reps. Keep your hands chest-high and control both the lowering and the lockout.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 10, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 25, "intermediate_seconds": null, "progression_sets": 3, "progression_reps_min": 50, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "push-ups", "step_number": 2, "step_name": "Incline Push-ups", "instruction_text": "Use a sturdy bench or table so your hands are elevated and your body stays in a straight line. Lower your chest to the edge, then press back up.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 10, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 20, "intermediate_seconds": null, "progression_sets": 3, "progression_reps_min": 40, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "push-ups", "step_number": 3, "step_name": "Kneeling Push-ups", "instruction_text": "Set up like a normal push-up but keep your knees on the floor. Lower under control and press back to full arm extension.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 10, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 15, "intermediate_seconds": null, "progression_sets": 3, "progression_reps_min": 30, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "push-ups", "step_number": 4, "step_name": "Half Push-ups", "instruction_text": "Use a partial range from the top half of a standard push-up. Keep your body tight and work clean, even reps.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 8, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 12, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 25, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "push-ups", "step_number": 5, "step_name": "Full Push-ups", "instruction_text": "Perform standard floor push-ups with a straight body. Lower until your chest is close to the floor and press to lockout.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 20, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "push-ups", "step_number": 6, "step_name": "Close Push-ups", "instruction_text": "Bring your hands closer than shoulder width to emphasize triceps and chest. Keep elbows controlled and body rigid.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 20, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "push-ups", "step_number": 7, "step_name": "Uneven Push-ups", "instruction_text": "Place one hand on a raised surface like a ball or block and the other on the floor. Let the floor hand do most of the work while you keep your torso square.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 20, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "push-ups", "step_number": 8, "step_name": "Half One-Arm Push-ups", "instruction_text": "Work a one-arm push-up pattern through a shortened range. Brace hard and avoid twisting as you press.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 20, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "push-ups", "step_number": 9, "step_name": "Lever Push-ups", "instruction_text": "Set up one-arm style but use the free arm as a light lever for balance, not a full assist. Keep the pressing arm doing the main work.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 20, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "push-ups", "step_number": 10, "step_name": "One-Arm Push-ups", "instruction_text": "Perform strict one-arm push-ups with the working hand under the shoulder and feet set wide for balance. Control the descent and avoid rotating the hips.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 1, "progression_reps_min": 100, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "squats", "step_number": 1, "step_name": "Shoulderstand Squats", "instruction_text": "From a shoulderstand, tuck and extend the legs to learn the squat pattern with minimal load. Move smoothly and keep the lower back supported.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 10, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 25, "intermediate_seconds": null, "progression_sets": 3, "progression_reps_min": 50, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "squats", "step_number": 2, "step_name": "Jackknife Squats", "instruction_text": "Use your hands on a support and let your legs do most of the work from a deep squat. Sit back and stand up under control.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 10, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 20, "intermediate_seconds": null, "progression_sets": 3, "progression_reps_min": 40, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "squats", "step_number": 3, "step_name": "Supported Squats", "instruction_text": "Hold a stable support and squat deeper while using only enough assistance to stay balanced. Try to keep weight through the feet.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 10, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 15, "intermediate_seconds": null, "progression_sets": 3, "progression_reps_min": 30, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "squats", "step_number": 4, "step_name": "Half Squats", "instruction_text": "Perform standing squats through the top half of the range. Keep your knees tracking over the feet and stand tall at the top.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 8, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 35, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 50, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "squats", "step_number": 5, "step_name": "Full Squats", "instruction_text": "Squat through a full comfortable range and stand back up without bouncing. Keep your heels down and chest controlled.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 30, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "squats", "step_number": 6, "step_name": "Close Squats", "instruction_text": "Use a narrower stance than usual and descend under control. Stay balanced and keep the knees aligned.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 20, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "squats", "step_number": 7, "step_name": "Uneven Squats", "instruction_text": "Shift more load onto one leg while the other leg lightly assists. Keep the hips level as you descend and rise.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 20, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "squats", "step_number": 8, "step_name": "Half One-Leg Squats", "instruction_text": "Use a pistol-style stance through a shorter range on one leg. Move slowly and keep the working foot planted.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 20, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "squats", "step_number": 9, "step_name": "Assisted One-Leg Squats", "instruction_text": "Perform one-leg squats with light assistance from a support for balance and control. Let the working leg handle most of the load.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 20, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "squats", "step_number": 10, "step_name": "One-Leg Squats", "instruction_text": "Perform strict one-leg squats on a single working leg. Control the descent, keep balance, and stand without twisting.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 50, "progression_reps_max": null, "progression_seconds": null, "source_page": 1},{"exercise_slug": "pull-ups", "step_number": 1, "step_name": "Vertical Pulls", "instruction_text": "Use a vertical support like a doorframe or post and lean back so you can pull your body toward the hands. Keep the movement smooth and controlled.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 10, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 20, "intermediate_seconds": null, "progression_sets": 3, "progression_reps_min": 40, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "pull-ups", "step_number": 2, "step_name": "Horizontal Pulls", "instruction_text": "Set up under a low bar or sturdy table and row your chest toward it. Keep your body straight and squeeze at the top.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 10, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 20, "intermediate_seconds": null, "progression_sets": 3, "progression_reps_min": 30, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "pull-ups", "step_number": 3, "step_name": "Jackknife Pull-ups", "instruction_text": "Use a bar with your feet supported in front of you so your arms and back learn the pull-up pattern. Reduce leg help as you get stronger.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 10, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 15, "intermediate_seconds": null, "progression_sets": 3, "progression_reps_min": 20, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "pull-ups", "step_number": 4, "step_name": "Half Pull-ups", "instruction_text": "Work the top half of the pull-up range with clean reps. Avoid jerking and lower under control.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 8, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 11, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 15, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "pull-ups", "step_number": 5, "step_name": "Full Pull-ups", "instruction_text": "Pull from a full hang until your chin clears the bar, then lower smoothly. Keep your body tight and avoid kipping.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 8, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 10, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "pull-ups", "step_number": 6, "step_name": "Close Pull-ups", "instruction_text": "Use a closer grip to emphasize the arms and upper back. Pull through a full range and control the descent.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 8, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 10, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "pull-ups", "step_number": 7, "step_name": "Uneven Pull-ups", "instruction_text": "Place one hand higher or farther from the center so one arm does more of the work. Keep the pull smooth and avoid twisting.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 7, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 9, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "pull-ups", "step_number": 8, "step_name": "Half One-Arm Pull-ups", "instruction_text": "Practice one-arm pulling strength through a shortened range with the free arm offering minimal balance. Stay controlled at both ends.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 4, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 6, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 8, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "pull-ups", "step_number": 9, "step_name": "Assisted One-Arm Pull-ups", "instruction_text": "Use the free hand or a light support to assist a one-arm pull-up pattern. Let the working arm do most of the pulling.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 3, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 5, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 7, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "pull-ups", "step_number": 10, "step_name": "One-Arm Pull-ups", "instruction_text": "Perform strict one-arm pull-ups with no momentum. Start from a dead hang, pull cleanly, and lower with control.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 1, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 2, "intermediate_seconds": null, "progression_sets": 1, "progression_reps_min": 6, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "leg-raises", "step_number": 1, "step_name": "Knee Tucks", "instruction_text": "Lie flat and draw your knees toward the chest without swinging. Lower back down under control.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 10, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 25, "intermediate_seconds": null, "progression_sets": 3, "progression_reps_min": 40, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "leg-raises", "step_number": 2, "step_name": "Flat Knee Raises", "instruction_text": "Lie flat with bent knees and raise the thighs until the hips curl slightly. Move slowly and keep tension in the abs.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 10, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 20, "intermediate_seconds": null, "progression_sets": 3, "progression_reps_min": 35, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "leg-raises", "step_number": 3, "step_name": "Flat Bent Leg Raises", "instruction_text": "Keep the legs bent and raise them from the hips while the lower back stays controlled. Do not rush the lowering phase.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 10, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 15, "intermediate_seconds": null, "progression_sets": 3, "progression_reps_min": 30, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "leg-raises", "step_number": 4, "step_name": "Flat Frog Raises", "instruction_text": "Bring the soles together in a frog position and raise the legs using the abs. Focus on pelvic control rather than momentum.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 8, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 15, "intermediate_seconds": null, "progression_sets": 3, "progression_reps_min": 25, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "leg-raises", "step_number": 5, "step_name": "Flat Straight Leg Raises", "instruction_text": "Keep the legs straight and raise them from the floor under control. Lower slowly without letting the back arch hard.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 20, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "leg-raises", "step_number": 6, "step_name": "Hanging Knee Raises", "instruction_text": "Hang from a bar and lift the knees toward the chest without swinging. Pause briefly, then lower under control.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 15, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "leg-raises", "step_number": 7, "step_name": "Hanging Bent Leg Raises", "instruction_text": "From a hang, raise bent legs higher than a simple knee raise while keeping the torso steady. Avoid using momentum.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 15, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "leg-raises", "step_number": 8, "step_name": "Hanging Frog Raises", "instruction_text": "Use a frog-legged position from the hang and lift through the abs and hips. Keep the motion tight and controlled.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 15, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "leg-raises", "step_number": 9, "step_name": "Partial Straight Leg Raises", "instruction_text": "From a hang, raise straight legs through a shortened range. Keep the shoulders packed and avoid swinging.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 15, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "leg-raises", "step_number": 10, "step_name": "Hanging Straight Leg Raises", "instruction_text": "Raise straight legs from a dead hang until you reach your target height. Control both the lift and the lowering.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 30, "progression_reps_max": null, "progression_seconds": null, "source_page": 2},{"exercise_slug": "bridges", "step_number": 1, "step_name": "Short Bridges", "instruction_text": "Lie on your back with knees bent and lift the hips into a short bridge. Squeeze the glutes and lower smoothly.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 10, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 25, "intermediate_seconds": null, "progression_sets": 3, "progression_reps_min": 50, "progression_reps_max": null, "progression_seconds": null, "source_page": 3},{"exercise_slug": "bridges", "step_number": 2, "step_name": "Straight Bridges", "instruction_text": "Press through the feet and hands to lift into a straighter bridge position. Focus on opening the front of the hips and shoulders.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 10, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 20, "intermediate_seconds": null, "progression_sets": 3, "progression_reps_min": 40, "progression_reps_max": null, "progression_seconds": null, "source_page": 3},{"exercise_slug": "bridges", "step_number": 3, "step_name": "Angled Bridges", "instruction_text": "Use an angled setup so you can extend the hips and shoulders further than a short bridge. Move steadily and breathe through the position.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 8, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 15, "intermediate_seconds": null, "progression_sets": 3, "progression_reps_min": 30, "progression_reps_max": null, "progression_seconds": null, "source_page": 3},{"exercise_slug": "bridges", "step_number": 4, "step_name": "Head Bridges", "instruction_text": "Bridge onto the head with support from the hands and feet while keeping pressure controlled. Build comfort and strength gradually.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 8, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 15, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 25, "progression_reps_max": null, "progression_seconds": null, "source_page": 3},{"exercise_slug": "bridges", "step_number": 5, "step_name": "Half Bridges", "instruction_text": "Push into a deeper bridge with more back and shoulder extension than the earlier steps. Keep the motion smooth and avoid collapsing.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 8, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 20, "progression_reps_max": null, "progression_seconds": null, "source_page": 3},{"exercise_slug": "bridges", "step_number": 6, "step_name": "Full Bridges", "instruction_text": "Perform a full bridge from hands and feet with the hips lifted high. Work on even pressure through the arms and legs.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 6, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 6, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 15, "progression_reps_max": null, "progression_seconds": null, "source_page": 3},{"exercise_slug": "bridges", "step_number": 7, "step_name": "Wall Walking Down", "instruction_text": "Start standing, walk the hands down a wall into a bridge, and stop at a controllable depth. Move slowly and keep tension throughout.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 3, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 6, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 10, "progression_reps_max": null, "progression_seconds": null, "source_page": 3},{"exercise_slug": "bridges", "step_number": 8, "step_name": "Wall Walking Up", "instruction_text": "From the bottom of a wall walk, press and walk the hands back up the wall to standing. Stay patient and keep the spine active.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 2, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 4, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 6, "progression_reps_max": null, "progression_seconds": null, "source_page": 3},{"exercise_slug": "bridges", "step_number": 9, "step_name": "Closing Bridges", "instruction_text": "Work on narrowing the distance between hands and feet in the bridge. Open the shoulders and hips while keeping the movement controlled.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 2, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 4, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 6, "progression_reps_max": null, "progression_seconds": null, "source_page": 3},{"exercise_slug": "bridges", "step_number": 10, "step_name": "Stand-to-Stand Bridges", "instruction_text": "Lower from standing into a full bridge and return to standing under control. Use smooth whole-body tension, not a drop.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 1, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 3, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 10, "progression_reps_max": 30, "progression_seconds": null, "source_page": 3},{"exercise_slug": "handstand-push-ups", "step_number": 1, "step_name": "Wall Headstands", "instruction_text": "Set up a tripod headstand with light wall support and hold the position steadily. Stay braced through the shoulders and core.", "measurement_unit": "seconds", "beginner_sets": null, "beginner_reps": null, "beginner_seconds": 30, "intermediate_sets": null, "intermediate_reps": null, "intermediate_seconds": 60, "progression_sets": null, "progression_reps_min": null, "progression_reps_max": null, "progression_seconds": 120, "source_page": 3},{"exercise_slug": "handstand-push-ups", "step_number": 2, "step_name": "Crow Stands", "instruction_text": "Balance with knees on the upper arms and hands on the floor. Keep the gaze forward and shift weight carefully into the hands.", "measurement_unit": "seconds", "beginner_sets": null, "beginner_reps": null, "beginner_seconds": 10, "intermediate_sets": null, "intermediate_reps": null, "intermediate_seconds": 30, "progression_sets": null, "progression_reps_min": null, "progression_reps_max": null, "progression_seconds": 60, "source_page": 3},{"exercise_slug": "handstand-push-ups", "step_number": 3, "step_name": "Wall Handstands", "instruction_text": "Kick up to a wall-supported handstand and hold a straight line as well as you can. Press tall through the shoulders and keep the core tight.", "measurement_unit": "seconds", "beginner_sets": null, "beginner_reps": null, "beginner_seconds": 30, "intermediate_sets": null, "intermediate_reps": null, "intermediate_seconds": 60, "progression_sets": null, "progression_reps_min": null, "progression_reps_max": null, "progression_seconds": 120, "source_page": 3},{"exercise_slug": "handstand-push-ups", "step_number": 4, "step_name": "Half Handstand Push-ups", "instruction_text": "Use a partial range handstand press against the wall. Lower only as far as you can control and press back up smoothly.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 20, "progression_reps_max": null, "progression_seconds": null, "source_page": 3},{"exercise_slug": "handstand-push-ups", "step_number": 5, "step_name": "Handstand Push-ups", "instruction_text": "Perform full-range wall handstand push-ups with control at the bottom and top. Keep the body tight and avoid crashing into the floor.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 10, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 15, "progression_reps_max": null, "progression_seconds": null, "source_page": 3},{"exercise_slug": "handstand-push-ups", "step_number": 6, "step_name": "Close Handstand Push-ups", "instruction_text": "Bring the hands closer to make the press harder and more vertical. Stay stacked and control the descent.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 8, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 10, "progression_reps_max": null, "progression_seconds": null, "source_page": 3},{"exercise_slug": "handstand-push-ups", "step_number": 7, "step_name": "Uneven Handstand Push-ups", "instruction_text": "Shift more load toward one arm while the other arm assists lightly. Keep the body aligned and move slowly.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 5, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 6, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 8, "progression_reps_max": null, "progression_seconds": null, "source_page": 3},{"exercise_slug": "handstand-push-ups", "step_number": 8, "step_name": "Half One-Arm Handstand Push-ups", "instruction_text": "Work a one-arm handstand press through a shortened range with strict control. Use the free arm only as needed for balance.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 3, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 4, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 6, "progression_reps_max": null, "progression_seconds": null, "source_page": 3},{"exercise_slug": "handstand-push-ups", "step_number": 9, "step_name": "Lever Handstand Push-ups", "instruction_text": "Use the free arm as a light lever while one arm handles most of the pressing load. Keep the shoulder packed and body tight.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 2, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 3, "intermediate_seconds": null, "progression_sets": 2, "progression_reps_min": 5, "progression_reps_max": null, "progression_seconds": null, "source_page": 3},{"exercise_slug": "handstand-push-ups", "step_number": 10, "step_name": "One-Arm Handstand Push-ups", "instruction_text": "Perform a strict one-arm handstand push-up with full control and balance. Stay patient and avoid twisting through the trunk.", "measurement_unit": "reps", "beginner_sets": 1, "beginner_reps": 1, "beginner_seconds": null, "intermediate_sets": 2, "intermediate_reps": 2, "intermediate_seconds": null, "progression_sets": 1, "progression_reps_min": 5, "progression_reps_max": null, "progression_seconds": null, "source_page": 3}]`);

const PROGRAM_SCHEDULE_ENTRIES = JSON.parse(String.raw`[{"program_slug": "good-behavior", "day_of_week": 1, "slot_number": 1, "exercise_slug": "push-ups", "work_sets_min": 2, "work_sets_max": 2},{"program_slug": "good-behavior", "day_of_week": 1, "slot_number": 2, "exercise_slug": "leg-raises", "work_sets_min": 2, "work_sets_max": 2},{"program_slug": "good-behavior", "day_of_week": 3, "slot_number": 1, "exercise_slug": "pull-ups", "work_sets_min": 2, "work_sets_max": 2},{"program_slug": "good-behavior", "day_of_week": 3, "slot_number": 2, "exercise_slug": "squats", "work_sets_min": 2, "work_sets_max": 2},{"program_slug": "good-behavior", "day_of_week": 5, "slot_number": 1, "exercise_slug": "handstand-push-ups", "work_sets_min": 2, "work_sets_max": 2},{"program_slug": "good-behavior", "day_of_week": 5, "slot_number": 2, "exercise_slug": "bridges", "work_sets_min": 2, "work_sets_max": 2},{"program_slug": "new-blood", "day_of_week": 1, "slot_number": 1, "exercise_slug": "push-ups", "work_sets_min": 2, "work_sets_max": 3},{"program_slug": "new-blood", "day_of_week": 1, "slot_number": 2, "exercise_slug": "leg-raises", "work_sets_min": 2, "work_sets_max": 3},{"program_slug": "new-blood", "day_of_week": 5, "slot_number": 1, "exercise_slug": "pull-ups", "work_sets_min": 2, "work_sets_max": 3},{"program_slug": "new-blood", "day_of_week": 5, "slot_number": 2, "exercise_slug": "squats", "work_sets_min": 2, "work_sets_max": 3},{"program_slug": "supermax", "day_of_week": 1, "slot_number": 1, "exercise_slug": "pull-ups", "work_sets_min": 10, "work_sets_max": 50},{"program_slug": "supermax", "day_of_week": 1, "slot_number": 2, "exercise_slug": "squats", "work_sets_min": 10, "work_sets_max": 50},{"program_slug": "supermax", "day_of_week": 2, "slot_number": 1, "exercise_slug": "push-ups", "work_sets_min": 10, "work_sets_max": 50},{"program_slug": "supermax", "day_of_week": 2, "slot_number": 2, "exercise_slug": "leg-raises", "work_sets_min": 10, "work_sets_max": 50},{"program_slug": "supermax", "day_of_week": 3, "slot_number": 1, "exercise_slug": "handstand-push-ups", "work_sets_min": 10, "work_sets_max": 50},{"program_slug": "supermax", "day_of_week": 3, "slot_number": 2, "exercise_slug": "bridges", "work_sets_min": 10, "work_sets_max": 50},{"program_slug": "supermax", "day_of_week": 4, "slot_number": 1, "exercise_slug": "pull-ups", "work_sets_min": 10, "work_sets_max": 50},{"program_slug": "supermax", "day_of_week": 4, "slot_number": 2, "exercise_slug": "squats", "work_sets_min": 10, "work_sets_max": 50},{"program_slug": "supermax", "day_of_week": 5, "slot_number": 1, "exercise_slug": "push-ups", "work_sets_min": 10, "work_sets_max": 50},{"program_slug": "supermax", "day_of_week": 5, "slot_number": 2, "exercise_slug": "leg-raises", "work_sets_min": 10, "work_sets_max": 50},{"program_slug": "supermax", "day_of_week": 6, "slot_number": 1, "exercise_slug": "handstand-push-ups", "work_sets_min": 10, "work_sets_max": 50},{"program_slug": "supermax", "day_of_week": 6, "slot_number": 2, "exercise_slug": "bridges", "work_sets_min": 10, "work_sets_max": 50},{"program_slug": "veterano", "day_of_week": 1, "slot_number": 1, "exercise_slug": "pull-ups", "work_sets_min": 2, "work_sets_max": 3},{"program_slug": "veterano", "day_of_week": 2, "slot_number": 1, "exercise_slug": "bridges", "work_sets_min": 2, "work_sets_max": 3},{"program_slug": "veterano", "day_of_week": 3, "slot_number": 1, "exercise_slug": "handstand-push-ups", "work_sets_min": 2, "work_sets_max": 3},{"program_slug": "veterano", "day_of_week": 4, "slot_number": 1, "exercise_slug": "leg-raises", "work_sets_min": 2, "work_sets_max": 3},{"program_slug": "veterano", "day_of_week": 5, "slot_number": 1, "exercise_slug": "squats", "work_sets_min": 2, "work_sets_max": 3},{"program_slug": "veterano", "day_of_week": 6, "slot_number": 1, "exercise_slug": "push-ups", "work_sets_min": 2, "work_sets_max": 3}]`);

async function hasTable(knex, tableName) {
  return knex.schema.hasTable(tableName);
}

async function hasColumn(knex, tableName, columnName) {
  return knex.schema.hasColumn(tableName, columnName);
}

function addManagedTimestamps(table, knex) {
  table.timestamp("created_at", { useTz: false }).notNullable().defaultTo(knex.fn.now());
  table
    .timestamp("updated_at", { useTz: false })
    .notNullable()
    .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
}

async function ensureExercisesTable(knex) {
  if (await hasTable(knex, "exercises")) {
    return;
  }

  await knex.schema.createTable("exercises", (table) => {
    table.bigIncrements("id").primary();
    table.string("slug", 120).notNullable();
    table.string("name", 160).notNullable();
    addManagedTimestamps(table, knex);
    table.unique(["slug"], "uq_exercises_slug");
    table.unique(["name"], "uq_exercises_name");
  });
}

async function ensureExerciseStepsTable(knex) {
  if (!(await hasTable(knex, "exercise_steps"))) {
    await knex.schema.createTable("exercise_steps", (table) => {
      table.bigIncrements("id").primary();
      table.bigInteger("exercise_id").unsigned().notNullable().references("id").inTable("exercises").onDelete("CASCADE");
      table.specificType("step_number", "tinyint unsigned").notNullable();
      table.string("step_name", 160).notNullable();
      table.text("instruction_text").nullable();
      table.string("measurement_unit", 16).notNullable().defaultTo("reps");
      table.integer("beginner_sets").unsigned().nullable();
      table.integer("beginner_reps").unsigned().nullable();
      table.integer("beginner_seconds").unsigned().nullable();
      table.integer("intermediate_sets").unsigned().nullable();
      table.integer("intermediate_reps").unsigned().nullable();
      table.integer("intermediate_seconds").unsigned().nullable();
      table.integer("progression_sets").unsigned().nullable();
      table.integer("progression_reps_min").unsigned().nullable();
      table.integer("progression_reps_max").unsigned().nullable();
      table.integer("progression_seconds").unsigned().nullable();
      table.specificType("source_page", "tinyint unsigned").notNullable();
      addManagedTimestamps(table, knex);
      table.unique(["exercise_id", "step_number"], "uq_exercise_steps_exercise_step_number");
      table.index(["exercise_id"], "idx_exercise_steps_exercise_id");
      table.index(["source_page"], "idx_exercise_steps_source_page");
    });
    return;
  }

  const instructionTextExists = await hasColumn(knex, "exercise_steps", "instruction_text");
  const measurementUnitExists = await hasColumn(knex, "exercise_steps", "measurement_unit");
  if (!instructionTextExists || !measurementUnitExists) {
    await knex.schema.alterTable("exercise_steps", (table) => {
      if (!instructionTextExists) {
        table.text("instruction_text").nullable();
      }
      if (!measurementUnitExists) {
        table.string("measurement_unit", 16).notNullable().defaultTo("reps");
      }
    });
  }

  if (!measurementUnitExists) {
    await knex("exercise_steps").whereNull("measurement_unit").update({
      measurement_unit: "reps"
    });
  }
}

async function ensureProgramsTable(knex) {
  if (await hasTable(knex, "programs")) {
    return;
  }

  await knex.schema.createTable("programs", (table) => {
    table.bigIncrements("id").primary();
    table.string("slug", 120).nullable();
    table.string("name", 160).notNullable();
    table.text("description").nullable();
    table.string("visibility", 32).notNullable().defaultTo("private");
    table.bigInteger("created_by_user_id").unsigned().nullable().references("id").inTable("users").onDelete("SET NULL");
    table.bigInteger("forked_from_program_id").unsigned().nullable().references("id").inTable("programs").onDelete("SET NULL");
    addManagedTimestamps(table, knex);
    table.unique(["slug"], "uq_programs_slug");
    table.index(["visibility"], "idx_programs_visibility");
    table.index(["created_by_user_id"], "idx_programs_created_by_user_id");
    table.index(["forked_from_program_id"], "idx_programs_forked_from_program_id");
  });
}

async function ensureProgramScheduleEntriesTable(knex) {
  if (await hasTable(knex, "program_schedule_entries")) {
    return;
  }

  await knex.schema.createTable("program_schedule_entries", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("program_id").unsigned().notNullable().references("id").inTable("programs").onDelete("CASCADE");
    table.specificType("day_of_week", "tinyint unsigned").notNullable();
    table.specificType("slot_number", "tinyint unsigned").notNullable().defaultTo(1);
    table.bigInteger("exercise_id").unsigned().notNullable().references("id").inTable("exercises");
    table.specificType("work_sets_min", "tinyint unsigned").notNullable();
    table.specificType("work_sets_max", "tinyint unsigned").notNullable();
    addManagedTimestamps(table, knex);
    table.unique(["program_id", "day_of_week", "slot_number"], "uq_program_schedule_entries_program_day_slot");
    table.unique(["program_id", "day_of_week", "exercise_id"], "uq_program_schedule_entries_program_day_exercise");
    table.index(["program_id"], "idx_program_schedule_entries_program_id");
    table.index(["exercise_id"], "idx_program_schedule_entries_exercise_id");
    table.index(["program_id", "day_of_week"], "idx_program_schedule_entries_program_day");
  });
}

async function ensureUserProgramAssignmentsTable(knex) {
  if (await hasTable(knex, "user_program_assignments")) {
    return;
  }

  await knex.schema.createTable("user_program_assignments", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("user_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.bigInteger("workspace_id").unsigned().nullable().references("id").inTable("workspaces").onDelete("SET NULL");
    table.date("starts_on").notNullable();
    table.date("ends_on").nullable();
    table.string("status", 32).notNullable().defaultTo("active");
    addManagedTimestamps(table, knex);
    table.index(["user_id"], "idx_user_program_assignments_user_id");
    table.index(["workspace_id"], "idx_user_program_assignments_workspace_id");
    table.index(["user_id", "status"], "idx_user_program_assignments_user_status");
  });
}

async function ensureUserProgramAssignmentRevisionsTable(knex) {
  if (await hasTable(knex, "user_program_assignment_revisions")) {
    return;
  }

  await knex.schema.createTable("user_program_assignment_revisions", (table) => {
    table.bigIncrements("id").primary();
    table
      .bigInteger("user_program_assignment_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("user_program_assignments")
      .onDelete("CASCADE");
    table.bigInteger("program_id").unsigned().notNullable().references("id").inTable("programs");
    table.date("effective_from_date").notNullable();
    table.string("change_reason", 64).notNullable().defaultTo("initial");
    table.text("notes").nullable();
    table.timestamp("created_at", { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.unique(["user_program_assignment_id", "effective_from_date"], "uq_user_program_assignment_revisions_assignment_effective_date");
    table.index(["user_program_assignment_id", "effective_from_date"], "idx_user_program_assignment_revisions_assignment_effective_date");
    table.index(["program_id"], "idx_user_program_assignment_revisions_program_id");
  });
}

async function ensureWorkoutOccurrencesTable(knex) {
  if (await hasTable(knex, "workout_occurrences")) {
    return;
  }

  await knex.schema.createTable("workout_occurrences", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("user_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    table
      .bigInteger("user_program_assignment_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("user_program_assignments");
    table
      .bigInteger("user_program_assignment_revision_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("user_program_assignment_revisions");
    table.bigInteger("workspace_id").unsigned().nullable().references("id").inTable("workspaces").onDelete("SET NULL");
    table.date("scheduled_for_date").notNullable();
    table.date("performed_on_date").nullable();
    table.string("status", 32).notNullable().defaultTo("in_progress");
    table.timestamp("started_at", { useTz: false }).nullable();
    table.timestamp("submitted_at", { useTz: false }).nullable();
    table.timestamp("definitely_missed_at", { useTz: false }).nullable();
    table.text("notes").nullable();
    addManagedTimestamps(table, knex);
    table.unique(["user_program_assignment_id", "scheduled_for_date"], "uq_workout_occurrences_assignment_scheduled_date");
    table.index(["user_id"], "idx_workout_occurrences_user_id");
    table.index(["user_id", "scheduled_for_date"], "idx_workout_occurrences_user_scheduled_date");
    table.index(["user_id", "performed_on_date"], "idx_workout_occurrences_user_performed_date");
    table.index(["user_program_assignment_revision_id", "scheduled_for_date"], "idx_workout_occurrences_revision_scheduled_date");
    table.index(["workspace_id"], "fk_workout_occurrences_workspace_id");
  });
}

async function ensurePersonalStepVariationsTable(knex) {
  if (await hasTable(knex, "personal_step_variations")) {
    return;
  }

  await knex.schema.createTable("personal_step_variations", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("user_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.bigInteger("canonical_step_id").unsigned().notNullable().references("id").inTable("exercise_steps").onDelete("CASCADE");
    table.string("name", 160).notNullable();
    table.string("measurement_unit", 16).notNullable().defaultTo("reps");
    table.string("reason", 160).nullable();
    table.text("notes").nullable();
    table.string("status", 32).notNullable().defaultTo("active");
    addManagedTimestamps(table, knex);
    table.index(["user_id"], "idx_personal_step_variations_user_id");
    table.index(["canonical_step_id"], "idx_personal_step_variations_canonical_step_id");
    table.index(["user_id", "canonical_step_id", "status"], "idx_personal_step_variations_user_step_status");
  });
}

async function ensureUserExerciseProgressTable(knex) {
  if (await hasTable(knex, "user_exercise_progress")) {
    return;
  }

  await knex.schema.createTable("user_exercise_progress", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("user_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.bigInteger("exercise_id").unsigned().notNullable().references("id").inTable("exercises").onDelete("CASCADE");
    table.bigInteger("current_step_id").unsigned().notNullable().references("id").inTable("exercise_steps");
    table.bigInteger("ready_to_advance_step_id").unsigned().nullable().references("id").inTable("exercise_steps");
    table.bigInteger("active_variation_id").unsigned().nullable().references("id").inTable("personal_step_variations").onDelete("SET NULL");
    table.timestamp("ready_to_advance_at", { useTz: false }).nullable();
    table.bigInteger("last_completed_occurrence_id").unsigned().nullable().references("id").inTable("workout_occurrences");
    table.timestamp("last_completed_at", { useTz: false }).nullable();
    table.integer("stall_count").unsigned().notNullable().defaultTo(0);
    addManagedTimestamps(table, knex);
    table.unique(["user_id", "exercise_id"], "uq_user_exercise_progress_user_exercise");
    table.index(["current_step_id"], "idx_user_exercise_progress_current_step_id");
    table.index(["ready_to_advance_step_id"], "idx_user_exercise_progress_ready_step_id");
    table.index(["exercise_id"], "fk_user_exercise_progress_exercise_id");
    table.index(["active_variation_id"], "fk_user_exercise_progress_active_variation_id");
    table.index(["last_completed_occurrence_id"], "fk_user_exercise_progress_last_completed_occurrence_id");
  });
}

async function ensureWorkoutOccurrenceExercisesTable(knex) {
  if (await hasTable(knex, "workout_occurrence_exercises")) {
    return;
  }

  await knex.schema.createTable("workout_occurrence_exercises", (table) => {
    table.bigIncrements("id").primary();
    table
      .bigInteger("workout_occurrence_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("workout_occurrences")
      .onDelete("CASCADE");
    table.integer("slot_number").unsigned().notNullable();
    table.bigInteger("exercise_id").unsigned().notNullable().references("id").inTable("exercises");
    table.string("exercise_name_snapshot", 160).notNullable();
    table.bigInteger("canonical_step_id").unsigned().notNullable().references("id").inTable("exercise_steps");
    table.string("canonical_step_name_snapshot", 160).notNullable();
    table
      .bigInteger("personal_step_variation_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("personal_step_variations")
      .onDelete("SET NULL");
    table.string("variation_name_snapshot", 160).nullable();
    table.string("measurement_unit_snapshot", 16).notNullable();
    table.integer("planned_work_sets_min").unsigned().notNullable();
    table.integer("planned_work_sets_max").unsigned().notNullable();
    table.integer("progression_sets_snapshot").unsigned().nullable();
    table.integer("progression_reps_min_snapshot").unsigned().nullable();
    table.integer("progression_reps_max_snapshot").unsigned().nullable();
    table.integer("progression_seconds_snapshot").unsigned().nullable();
    table.string("status", 32).notNullable().defaultTo("pending");
    table.text("notes").nullable();
    addManagedTimestamps(table, knex);
    table.unique(["workout_occurrence_id", "slot_number"], "uq_workout_occurrence_exercises_occurrence_slot");
    table.unique(["workout_occurrence_id", "exercise_id"], "uq_workout_occurrence_exercises_occurrence_exercise");
    table.index(["exercise_id"], "idx_workout_occurrence_exercises_exercise_id");
    table.index(["canonical_step_id"], "idx_workout_occurrence_exercises_canonical_step_id");
    table.index(["personal_step_variation_id"], "fk_workout_occurrence_exercises_personal_step_variation_id");
  });
}

async function ensureWorkoutSetLogsTable(knex) {
  if (await hasTable(knex, "workout_set_logs")) {
    return;
  }

  await knex.schema.createTable("workout_set_logs", (table) => {
    table.bigIncrements("id").primary();
    table
      .bigInteger("workout_occurrence_exercise_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("workout_occurrence_exercises")
      .onDelete("CASCADE");
    table.integer("set_number").unsigned().notNullable();
    table.string("side", 16).notNullable().defaultTo("both");
    table.string("measurement_unit_snapshot", 16).notNullable();
    table.integer("performed_value").unsigned().notNullable();
    table.boolean("qualifies_for_progression").notNullable().defaultTo(false);
    table.timestamp("logged_at", { useTz: false }).notNullable().defaultTo(knex.fn.now());
    addManagedTimestamps(table, knex);
    table.unique(["workout_occurrence_exercise_id", "set_number", "side"], "uq_workout_set_logs_occurrence_exercise_set_side");
    table.index(["logged_at"], "idx_workout_set_logs_logged_at");
  });
}

async function upsertRow(knex, tableName, whereClause, insertValues, updateValues) {
  const existingRow = await knex(tableName).select("id").where(whereClause).first();
  if (existingRow) {
    await knex(tableName).where({ id: existingRow.id }).update(updateValues);
    return existingRow.id;
  }

  const insertResult = await knex(tableName).insert(insertValues);
  if (Array.isArray(insertResult)) {
    return insertResult[0];
  }
  return insertResult;
}

async function seedExercises(knex) {
  for (const exercise of EXERCISES) {
    await upsertRow(
      knex,
      "exercises",
      { slug: exercise.slug },
      exercise,
      { name: exercise.name }
    );
  }
}

async function seedPrograms(knex) {
  for (const program of PROGRAMS) {
    await upsertRow(
      knex,
      "programs",
      { slug: program.slug },
      program,
      {
        name: program.name,
        description: program.description,
        visibility: program.visibility
      }
    );
  }
}

async function buildSlugIdMap(knex, tableName) {
  const rows = await knex(tableName).select(["id", "slug"]);
  return new Map(rows.map((row) => [String(row.slug || "").trim(), row.id]));
}

async function seedExerciseSteps(knex) {
  const exerciseIdsBySlug = await buildSlugIdMap(knex, "exercises");

  for (const step of EXERCISE_STEPS) {
    const exerciseId = exerciseIdsBySlug.get(step.exercise_slug);
    if (!exerciseId) {
      throw new Error(`Missing exercise for step seed: ${step.exercise_slug}`);
    }

    const insertValues = {
      exercise_id: exerciseId,
      step_number: step.step_number,
      step_name: step.step_name,
      instruction_text: step.instruction_text,
      measurement_unit: step.measurement_unit,
      beginner_sets: step.beginner_sets,
      beginner_reps: step.beginner_reps,
      beginner_seconds: step.beginner_seconds,
      intermediate_sets: step.intermediate_sets,
      intermediate_reps: step.intermediate_reps,
      intermediate_seconds: step.intermediate_seconds,
      progression_sets: step.progression_sets,
      progression_reps_min: step.progression_reps_min,
      progression_reps_max: step.progression_reps_max,
      progression_seconds: step.progression_seconds,
      source_page: step.source_page
    };

    await upsertRow(
      knex,
      "exercise_steps",
      {
        exercise_id: exerciseId,
        step_number: step.step_number
      },
      insertValues,
      {
        step_name: step.step_name,
        instruction_text: step.instruction_text,
        measurement_unit: step.measurement_unit,
        beginner_sets: step.beginner_sets,
        beginner_reps: step.beginner_reps,
        beginner_seconds: step.beginner_seconds,
        intermediate_sets: step.intermediate_sets,
        intermediate_reps: step.intermediate_reps,
        intermediate_seconds: step.intermediate_seconds,
        progression_sets: step.progression_sets,
        progression_reps_min: step.progression_reps_min,
        progression_reps_max: step.progression_reps_max,
        progression_seconds: step.progression_seconds,
        source_page: step.source_page
      }
    );
  }
}

async function seedProgramScheduleEntries(knex) {
  const programIdsBySlug = await buildSlugIdMap(knex, "programs");
  const exerciseIdsBySlug = await buildSlugIdMap(knex, "exercises");

  for (const entry of PROGRAM_SCHEDULE_ENTRIES) {
    const programId = programIdsBySlug.get(entry.program_slug);
    const exerciseId = exerciseIdsBySlug.get(entry.exercise_slug);
    if (!programId) {
      throw new Error(`Missing program for schedule seed: ${entry.program_slug}`);
    }
    if (!exerciseId) {
      throw new Error(`Missing exercise for schedule seed: ${entry.exercise_slug}`);
    }

    const insertValues = {
      program_id: programId,
      day_of_week: entry.day_of_week,
      slot_number: entry.slot_number,
      exercise_id: exerciseId,
      work_sets_min: entry.work_sets_min,
      work_sets_max: entry.work_sets_max
    };

    await upsertRow(
      knex,
      "program_schedule_entries",
      {
        program_id: programId,
        day_of_week: entry.day_of_week,
        slot_number: entry.slot_number
      },
      insertValues,
      {
        exercise_id: exerciseId,
        work_sets_min: entry.work_sets_min,
        work_sets_max: entry.work_sets_max
      }
    );
  }
}

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await ensureExercisesTable(knex);
  await ensureExerciseStepsTable(knex);
  await ensureProgramsTable(knex);
  await ensureProgramScheduleEntriesTable(knex);
  await ensureUserProgramAssignmentsTable(knex);
  await ensureUserProgramAssignmentRevisionsTable(knex);
  await ensureWorkoutOccurrencesTable(knex);
  await ensurePersonalStepVariationsTable(knex);
  await ensureUserExerciseProgressTable(knex);
  await ensureWorkoutOccurrenceExercisesTable(knex);
  await ensureWorkoutSetLogsTable(knex);

  await seedExercises(knex);
  await seedPrograms(knex);
  await seedExerciseSteps(knex);
  await seedProgramScheduleEntries(knex);
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("workout_set_logs");
  await knex.schema.dropTableIfExists("workout_occurrence_exercises");
  await knex.schema.dropTableIfExists("user_exercise_progress");
  await knex.schema.dropTableIfExists("personal_step_variations");
  await knex.schema.dropTableIfExists("workout_occurrences");
  await knex.schema.dropTableIfExists("user_program_assignment_revisions");
  await knex.schema.dropTableIfExists("user_program_assignments");
  await knex.schema.dropTableIfExists("program_schedule_entries");
  await knex.schema.dropTableIfExists("exercise_steps");
  await knex.schema.dropTableIfExists("programs");
  await knex.schema.dropTableIfExists("exercises");
};
