from flask import Blueprint, jsonify, request

from services.learning_service import (
    LearningError,
    get_daily_goal,
    get_dashboard,
    get_lesson,
    submit_attempt,
)

learning_bp = Blueprint("learning", __name__)


def _run(fn, *args):
    try:
        return jsonify(fn(*args))
    except LearningError as exc:
        return jsonify({"error": exc.message}), exc.status
    except Exception as exc:
        print("DB error:", exc)
        return jsonify({"error": "Server error, dobara try karo"}), 500


@learning_bp.route("/dashboard", methods=["GET"])
def dashboard():
    return _run(get_dashboard)


@learning_bp.route("/daily-goal", methods=["GET"])
def daily_goal():
    return _run(get_daily_goal)


@learning_bp.route("/lessons/<int:lesson_id>", methods=["GET"])
def lesson(lesson_id):
    return _run(get_lesson, lesson_id)


@learning_bp.route("/lessons/<int:lesson_id>/attempts", methods=["POST"])
def attempt(lesson_id):
    return _run(submit_attempt, lesson_id, request.get_json(silent=True))