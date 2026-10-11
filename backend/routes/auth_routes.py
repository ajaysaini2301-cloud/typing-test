import os
from functools import wraps

import jwt
from flask import Blueprint, jsonify, request, current_app, g

from services.auth_service import (
    register_user,
    login_user,
    get_user_by_id,
)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def token_required(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        parts = header.split()

        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"error": "Authentication token required."}), 401

        try:
            payload = jwt.decode(
                parts[1],
                current_app.config["JWT_SECRET_KEY"],
                algorithms=["HS256"],
                options={"require": ["sub", "iat", "exp"]},
            )
            g.user_id = int(payload["sub"])

        except (jwt.InvalidTokenError, ValueError, TypeError):
            return jsonify({"error": "Invalid or expired token."}), 401

        return view_func(*args, **kwargs)

    return wrapper


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not all(isinstance(v, str) for v in (name, email, password)):
        return jsonify({"error": "Name, email and password are required."}), 400

    try:
        user = register_user(name, email, password)
        return jsonify({
            "message": "Account created successfully.",
            "user": user,
        }), 201

    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")

    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify({"error": "Email and password are required."}), 400

    try:
        result = login_user(email, password)
        return jsonify(result), 200

    except ValueError as exc:
        return jsonify({"error": str(exc)}), 401


@auth_bp.get("/me")
@token_required
def me():
    user = get_user_by_id(g.user_id)

    if not user or not user["is_active"]:
        return jsonify({"error": "User account not found or inactive."}), 401

    if user.get("created_at") is not None:
        user["created_at"] = user["created_at"].isoformat()

    user["is_active"] = bool(user["is_active"])

    return jsonify({"user": user}), 200