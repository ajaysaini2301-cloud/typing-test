from flask import Blueprint, jsonify, request

from services.test_service import (
    get_random_passage,
    get_recent_results,
    get_stats,
    save_result,
    validate_result,
)

test_bp = Blueprint("test", __name__)


@test_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Backend is running"})


@test_bp.route("/passage", methods=["GET"])
def passage():
    category = request.args.get("category", "random")
    return jsonify({"passage": get_random_passage(category)})


@test_bp.route("/results", methods=["POST"])
def create_result():
    data = request.get_json(silent=True)

    error = validate_result(data)
    if error:
        return jsonify({"error": error}), 400

    try:
        new_id = save_result(data)
    except Exception as exc:
        print("DB error:", exc)
        return jsonify({"error": "Could not save result"}), 500

    return jsonify({"message": "Result saved", "id": new_id}), 201


@test_bp.route("/results", methods=["GET"])
def list_results():
    try:
        results = get_recent_results()
    except Exception as exc:
        print("DB error:", exc)
        return jsonify({"error": "Could not fetch results"}), 500

    return jsonify({"results": results})


@test_bp.route("/stats", methods=["GET"])
def stats():
    try:
        stats_data, progress = get_stats()
    except Exception as exc:
        print("DB error:", exc)
        return jsonify({"error": "Could not fetch stats"}), 500

    return jsonify({"stats": stats_data, "progress": progress})