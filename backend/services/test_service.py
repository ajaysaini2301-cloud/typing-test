import random

from utils.database import get_db_connection

PASSAGES = {
    "easy": [
        "The sun is bright and the sky is blue. We go to the park to play with our friends. "
        "The dog runs fast and the kids laugh out loud. It is a good day to be outside.",
        "I like to read books at night. My favorite book is about a small boat. "
        "The boat sails far away and finds a new land. I hope to read it again soon.",
        "Our cat sleeps on the soft chair all day. When it is hungry, it walks to the kitchen. "
        "We give it milk and it purrs with joy. Then it goes back to sleep.",
    ],
    "medium": [
        "Technology has changed the way we live, work and communicate with each other. "
        "It connects people from different parts of the world and opens new opportunities "
        "for learning, creativity and growth. With discipline and the right skills, "
        "anyone can achieve their goals.",
        "Practice makes progress, so type a little every day and watch your speed grow. "
        "A good developer writes clean code, tests it often, and learns from every bug. "
        "Small improvements, repeated daily, turn into impressive results over time.",
        "Typing fast is useful, but typing accurately is what saves time in the long run. "
        "Focus on rhythm instead of speed, keep your eyes on the screen, "
        "and let your fingers find the keys without looking down.",
    ],
    "hard": [
        "Photosynthesis, the biochemical process by which plants convert sunlight, water, "
        "and carbon dioxide into glucose and oxygen, sustains nearly every ecosystem; "
        "consequently, researchers continually investigate how chlorophyll absorbs wavelengths "
        "(430-662 nm) with extraordinary efficiency.",
        "Entrepreneurs often discover that perseverance, unlike talent, cannot be outsourced: "
        "quarterly projections fluctuate, regulations change overnight, and customers' "
        "expectations evolve; nevertheless, disciplined teams adapt, iterate, and succeed.",
        "The archaeologist meticulously excavated the ancient settlement, cataloguing pottery "
        "fragments, bronze artifacts, and inscriptions that revealed how a thriving "
        "civilization had managed irrigation, trade, and governance 3,000 years ago.",
    ],
}

CATEGORIES = ("random", "easy", "medium", "hard")
DURATIONS = (15, 30, 60, 120)


def get_random_passage(category="random"):
    if category in PASSAGES:
        return random.choice(PASSAGES[category])
    all_passages = [p for group in PASSAGES.values() for p in group]
    return random.choice(all_passages)


def validate_result(data):
    """Result data check karta hai. Error message ya None return karta hai."""
    if not isinstance(data, dict):
        return "Invalid JSON body"

    for field in ("wpm", "accuracy", "errors", "duration_seconds"):
        if field not in data:
            return f"Missing field: {field}"

    try:
        wpm = int(data["wpm"])
        accuracy = float(data["accuracy"])
        errors = int(data["errors"])
        duration = int(data["duration_seconds"])
    except (TypeError, ValueError):
        return "All fields must be numbers"

    if data.get("category", "random") not in CATEGORIES:
        return "Invalid category"
    if wpm < 0 or wpm > 400:
        return "wpm must be between 0 and 400"
    if accuracy < 0 or accuracy > 100:
        return "accuracy must be between 0 and 100"
    if errors < 0:
        return "errors cannot be negative"
    if duration <= 0 or duration > 3600:
        return "duration_seconds must be between 1 and 3600"

    return None


def save_result(data):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO test_results (wpm, accuracy, errors, duration_seconds, category) "
                "VALUES (%s, %s, %s, %s, %s)",
                (
                    int(data["wpm"]),
                    float(data["accuracy"]),
                    int(data["errors"]),
                    int(data["duration_seconds"]),
                    data.get("category", "random"),
                ),
            )
            new_id = cursor.lastrowid
        connection.commit()
        return new_id
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def get_recent_results(limit=8):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, wpm, accuracy, errors, duration_seconds, category, created_at "
                "FROM test_results ORDER BY id DESC LIMIT %s",
                (limit,),
            )
            rows = cursor.fetchall()
        for row in rows:
            row["accuracy"] = float(row["accuracy"])
            row["created_at"] = row["created_at"].isoformat()
        return rows
    finally:
        connection.close()


def get_stats():
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) AS total_tests, "
                "COALESCE(MAX(wpm), 0) AS best_wpm, "
                "COALESCE(MAX(accuracy), 0) AS best_accuracy, "
                "COALESCE(ROUND(AVG(wpm)), 0) AS avg_wpm "
                "FROM test_results"
            )
            stats = cursor.fetchone()

            cursor.execute(
                "SELECT DATE(created_at) AS day, MAX(wpm) AS best_wpm "
                "FROM test_results "
                "WHERE created_at >= NOW() - INTERVAL 7 DAY "
                "GROUP BY DATE(created_at) ORDER BY day"
            )
            progress = cursor.fetchall()

        stats["best_accuracy"] = float(stats["best_accuracy"])
        stats["best_wpm"] = int(stats["best_wpm"])
        stats["avg_wpm"] = int(stats["avg_wpm"])
        for row in progress:
            row["day"] = row["day"].isoformat()
            row["best_wpm"] = int(row["best_wpm"])
        return stats, progress
    finally:
        connection.close()