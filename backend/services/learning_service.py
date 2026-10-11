from datetime import date, timedelta

from utils.database import get_db_connection

# Typing test aur lesson practice dono ko ek activity feed ki tarah dekhte hain
ACTIVITY_SQL = (
    "SELECT 'Typing Test' AS activity_type, accuracy, wpm, duration_seconds, created_at FROM test_results "
    "UNION ALL "
    "SELECT session_type AS activity_type, accuracy, wpm, duration_seconds, created_at FROM practice_sessions"
)


def _f(value):
    return float(value) if value is not None else None


def _daily_goal(cur):
    cur.execute("SELECT setting_value FROM learner_settings WHERE setting_key = 'daily_goal_minutes'")
    row = cur.fetchone()
    goal = int(row["setting_value"]) if row else 30
    cur.execute(
        f"SELECT COALESCE(SUM(duration_seconds), 0) AS secs FROM ({ACTIVITY_SQL}) a "
        "WHERE DATE(created_at) = CURDATE()"
    )
    secs = int(cur.fetchone()["secs"])
    return {"goal_minutes": goal, "done_minutes": round(secs / 60, 1)}


def get_daily_goal():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            return _daily_goal(cur)
    finally:
        conn.close()


def _streak(dates):
    days = set(dates)
    today = date.today()
    day = today if today in days else today - timedelta(days=1)
    count = 0
    while day in days:
        count += 1
        day -= timedelta(days=1)
    return count


def _stage_summary(cur):
    cur.execute("SELECT id, stage_number, title, icon FROM learning_stages ORDER BY stage_number")
    stages = cur.fetchall()
    cur.execute(
        "SELECT l.id, l.title, s.stage_number, p.status "
        "FROM learning_lessons l "
        "JOIN learning_stages s ON s.id = l.stage_id "
        "LEFT JOIN user_lesson_progress p ON p.lesson_id = l.id "
        "ORDER BY s.stage_number, l.lesson_number"
    )
    lessons = cur.fetchall()

    next_lesson = None
    by_stage = {}
    for i, lesson in enumerate(lessons):
        # lesson tabhi unlock hota hai jab pichla lesson complete ho (server-side rule)
        lesson["unlocked"] = i == 0 or lessons[i - 1]["status"] == "completed"
        if lesson["status"] != "completed" and next_lesson is None:
            next_lesson = lesson
        by_stage.setdefault(lesson["stage_number"], []).append(lesson)

    summary = []
    for s in stages:
        group = by_stage.get(s["stage_number"], [])
        total = len(group)
        done = sum(1 for l in group if l["status"] == "completed")
        if total and done == total:
            status = "completed"
        elif group and group[0]["unlocked"]:
            status = "available"
        else:
            status = "locked"
        summary.append({
            "stage_number": s["stage_number"],
            "title": s["title"],
            "icon": s["icon"],
            "total_lessons": total,
            "completed_lessons": done,
            "percent": round(done / total * 100) if total else 0,
            "status": status,
        })

    current = summary[-1] if summary else None
    if next_lesson:
        current = next(x for x in summary if x["stage_number"] == next_lesson["stage_number"])
    next_info = (
        {"id": next_lesson["id"], "title": next_lesson["title"]} if next_lesson else None
    )
    return summary, current, next_info


def get_dashboard():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            stages, current_stage, next_lesson = _stage_summary(cur)

            cur.execute(f"SELECT * FROM ({ACTIVITY_SQL}) a ORDER BY created_at DESC LIMIT 4")
            recent = cur.fetchall()

            cur.execute(f"SELECT COALESCE(MAX(wpm), 0) AS best FROM ({ACTIVITY_SQL}) a")
            best_wpm = int(cur.fetchone()["best"])

            cur.execute(
                "SELECT "
                "AVG(CASE WHEN created_at >= NOW() - INTERVAL 7 DAY THEN wpm END) AS this_week, "
                "AVG(CASE WHEN created_at < NOW() - INTERVAL 7 DAY THEN wpm END) AS last_week "
                f"FROM ({ACTIVITY_SQL}) a WHERE created_at >= NOW() - INTERVAL 14 DAY"
            )
            weeks = cur.fetchone()
            this_week, last_week = _f(weeks["this_week"]), _f(weeks["last_week"])
            wpm_change = (
                round((this_week - last_week) / last_week * 100)
                if this_week is not None and last_week
                else None
            )

            cur.execute(f"SELECT DISTINCT DATE(created_at) AS d FROM ({ACTIVITY_SQL}) a")
            streak = _streak([r["d"] for r in cur.fetchall()])

            cur.execute(
                f"SELECT activity_type, accuracy, wpm, duration_seconds, created_at FROM ({ACTIVITY_SQL}) a "
                "WHERE DATE(created_at) = CURDATE() ORDER BY created_at DESC"
            )
            today = cur.fetchall()

            cur.execute(
                "SELECT DATE(created_at) AS day, ROUND(AVG(wpm)) AS wpm, ROUND(AVG(accuracy), 1) AS accuracy "
                f"FROM ({ACTIVITY_SQL}) a WHERE created_at >= CURDATE() - INTERVAL 6 DAY "
                "GROUP BY DATE(created_at) ORDER BY day"
            )
            chart = cur.fetchall()

            goal = _daily_goal(cur)

        def activity(row):
            return {
                "activity_type": row["activity_type"],
                "accuracy": _f(row["accuracy"]),
                "wpm": int(row["wpm"]),
                "duration_seconds": int(row["duration_seconds"]),
                "created_at": row["created_at"].isoformat(),
            }

        recent_out = [activity(r) for r in recent]
        latest = recent_out[0] if recent_out else None
        previous = recent_out[1] if len(recent_out) > 1 else None

        return {
            "stages": stages,
            "current_stage": current_stage,
            "next_lesson": next_lesson,
            "stats": {
                "current_wpm": latest["wpm"] if latest else None,
                "wpm_change_pct": wpm_change,
                "best_wpm": best_wpm,
                "accuracy": latest["accuracy"] if latest else None,
                "accuracy_delta": (
                    round(latest["accuracy"] - previous["accuracy"], 1) if latest and previous else None
                ),
                "streak_days": streak,
            },
            "recent": recent_out,
            "today": [activity(r) for r in today],
            "daily_goal": goal,
            "chart": [
                {"day": r["day"].isoformat(), "wpm": int(r["wpm"]), "accuracy": float(r["accuracy"])}
                for r in chart
            ],
        }
    finally:
        conn.close()

class LearningError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


SESSION_LABEL = {
    "character": "Character Practice",
    "combination": "Key Combination Practice",
    "word": "Word Practice",
    "sentence": "Sentence Practice",
    "paragraph": "Paragraph Practice",
}


def _lesson_context(cur, lesson_id):
    cur.execute(
        "SELECT l.id, l.title, l.objective, l.lesson_type, l.pass_accuracy, s.stage_number, p.status "
        "FROM learning_lessons l "
        "JOIN learning_stages s ON s.id = l.stage_id "
        "LEFT JOIN user_lesson_progress p ON p.lesson_id = l.id "
        "ORDER BY s.stage_number, l.lesson_number"
    )
    lessons = cur.fetchall()
    idx = next((i for i, l in enumerate(lessons) if l["id"] == lesson_id), None)
    if idx is None:
        raise LearningError("Lesson nahi mila", 404)
    unlocked = idx == 0 or lessons[idx - 1]["status"] == "completed"
    next_id = lessons[idx + 1]["id"] if idx + 1 < len(lessons) else None
    return lessons[idx], unlocked, next_id


def _check_openable(lesson, unlocked):
    if not unlocked:
        raise LearningError("Ye lesson locked hai. Pehle pichla lesson complete karo.", 403)
    if lesson["lesson_type"] == "timed":
        raise LearningError("Ye lesson Typing Test page par hota hai.", 400)


def get_lesson(lesson_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            lesson, unlocked, _ = _lesson_context(cur, lesson_id)
            _check_openable(lesson, unlocked)
            cur.execute(
                "SELECT position, target_text FROM learning_exercises "
                "WHERE lesson_id = %s ORDER BY position",
                (lesson_id,),
            )
            exercises = cur.fetchall()
        if not exercises:
            raise LearningError("Is lesson mein abhi exercises nahi hain.", 404)
        return {
            "id": lesson["id"],
            "title": lesson["title"],
            "objective": lesson["objective"],
            "lesson_type": lesson["lesson_type"],
            "pass_accuracy": float(lesson["pass_accuracy"]),
            "exercises": exercises,
        }
    finally:
        conn.close()


def _int(value, name, low=0):
    try:
        number = int(value)
    except (TypeError, ValueError):
        raise LearningError(f"{name} number hona chahiye")
    if number < low:
        raise LearningError(f"{name} galat hai")
    return number


def submit_attempt(lesson_id, data):
    if not isinstance(data, dict):
        raise LearningError("Invalid JSON body")
    token = data.get("client_token")
    if not isinstance(token, str) or not (8 <= len(token) <= 40):
        raise LearningError("client_token galat hai")
    try:
        duration = float(data.get("duration_seconds"))
    except (TypeError, ValueError):
        raise LearningError("duration_seconds number hona chahiye")
    if not (0 < duration <= 7200):
        raise LearningError("duration_seconds galat hai")
    submitted = data.get("exercises")
    if not isinstance(submitted, list) or not submitted:
        raise LearningError("exercises list chahiye")

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # duplicate submit: pehle wala result hi wapas do
            cur.execute(
                "SELECT id, lesson_id, accuracy, passed, correct_chars, error_chars "
                "FROM practice_sessions WHERE client_token = %s",
                (token,),
            )
            old = cur.fetchone()
            if old:
                _, _, next_id = _lesson_context(cur, old["lesson_id"])
                return {
                    "duplicate": True,
                    "attempt_id": old["id"],
                    "passed": bool(old["passed"]),
                    "accuracy": float(old["accuracy"]),
                    "correct_chars": old["correct_chars"],
                    "error_chars": old["error_chars"],
                    "next_lesson_id": next_id if old["passed"] else None,
                }

            lesson, unlocked, next_id = _lesson_context(cur, lesson_id)
            _check_openable(lesson, unlocked)

            cur.execute(
                "SELECT position, target_text FROM learning_exercises WHERE lesson_id = %s",
                (lesson_id,),
            )
            targets = {r["position"]: r["target_text"] for r in cur.fetchall()}
            if len(submitted) != len(targets):
                raise LearningError("Saari exercises complete nahi hui")

            total_keys = total_errors = total_correct = 0
            seen = set()
            for ex in submitted:
                if not isinstance(ex, dict):
                    raise LearningError("Exercise data galat hai")
                pos = _int(ex.get("position"), "position", 1)
                if pos not in targets or pos in seen:
                    raise LearningError("Exercise position galat hai")
                seen.add(pos)
                target = targets[pos]
                typed = ex.get("typed")
                if not isinstance(typed, str) or len(typed) != len(target):
                    raise LearningError("Exercise poori type nahi hui")
                correct = sum(1 for a, b in zip(typed, target) if a == b)
                keys = max(_int(ex.get("total_keys"), "total_keys"), len(target))
                errors = min(max(_int(ex.get("errors"), "errors"), len(target) - correct), keys)
                total_keys += keys
                total_errors += errors
                total_correct += correct

            accuracy = round((total_keys - total_errors) / total_keys * 100, 2)
            passed = accuracy >= float(lesson["pass_accuracy"])
            seconds = max(1, round(duration))
            wpm = round(total_correct / 5 / (seconds / 60))

            cur.execute(
                "INSERT INTO practice_sessions "
                "(lesson_id, session_type, accuracy, wpm, correct_chars, error_chars, "
                "duration_seconds, client_token, passed) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (lesson_id, SESSION_LABEL[lesson["lesson_type"]], accuracy, wpm,
                 total_correct, total_errors, seconds, token, 1 if passed else 0),
            )
            attempt_id = cur.lastrowid

            cur.execute(
                "INSERT INTO user_lesson_progress (lesson_id, status, best_accuracy, attempts, completed_at) "
                "VALUES (%s, %s, %s, 1, IF(%s, NOW(), NULL)) "
                "ON DUPLICATE KEY UPDATE "
                "attempts = attempts + 1, "
                "best_accuracy = GREATEST(best_accuracy, VALUES(best_accuracy)), "
                "status = IF(status = 'completed' OR VALUES(status) = 'completed', 'completed', 'in_progress'), "
                "completed_at = IF(completed_at IS NULL AND VALUES(status) = 'completed', NOW(), completed_at)",
                (lesson_id, "completed" if passed else "in_progress", accuracy, 1 if passed else 0),
            )
        conn.commit()
        return {
            "duplicate": False,
            "attempt_id": attempt_id,
            "passed": passed,
            "accuracy": accuracy,
            "correct_chars": total_correct,
            "error_chars": total_errors,
            "wpm": wpm,
            "next_lesson_id": next_id if passed else None,
        }
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()        