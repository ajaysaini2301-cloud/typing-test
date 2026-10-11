import os
from datetime import datetime, timedelta, timezone

import jwt
from flask import current_app
from werkzeug.security import generate_password_hash, check_password_hash

from utils.database import get_db_connection


def register_user(name, email, password):
    name = name.strip()
    email = email.strip().lower()

    if not name or len(name) > 100:
        raise ValueError("Name is required and must be under 100 characters.")

    if len(email) > 255 or "@" not in email:
        raise ValueError("Please enter a valid email address.")

    if len(password) < 8 or len(password) > 128:
        raise ValueError("Password must be 8 to 128 characters long.")

    password_hash = generate_password_hash(password)

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO users (name, email, password_hash)
                VALUES (%s, %s, %s)
                """,
                (name, email, password_hash),
            )
            user_id = cursor.lastrowid

        conn.commit()
        return {
            "id": user_id,
            "name": name,
            "email": email,
        }

    except Exception as exc:
        conn.rollback()

        # MySQL duplicate-key error
        if getattr(exc, "args", [None])[0] == 1062:
            raise ValueError("An account with this email already exists.") from exc

        raise

    finally:
        conn.close()


def login_user(email, password):
    email = email.strip().lower()

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, name, email, password_hash, is_active
                FROM users
                WHERE email = %s
                LIMIT 1
                """,
                (email,),
            )
            user = cursor.fetchone()
    finally:
        conn.close()

    if not user or not check_password_hash(user["password_hash"], password):
        raise ValueError("Invalid email or password.")

    if not user["is_active"]:
        raise ValueError("This account is inactive.")

    now = datetime.now(timezone.utc)
    minutes = int(os.getenv("JWT_ACCESS_TOKEN_MINUTES", "30"))

    token = jwt.encode(
        {
            "sub": str(user["id"]),
            "iat": now,
            "exp": now + timedelta(minutes=minutes),
        },
        current_app.config["JWT_SECRET_KEY"],
        algorithm="HS256",
    )

    return {
        "access_token": token,
        "token_type": "Bearer",
        "expires_in": minutes * 60,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
        },
    }


def get_user_by_id(user_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, name, email, is_active, created_at
                FROM users
                WHERE id = %s
                LIMIT 1
                """,
                (user_id,),
            )
            return cursor.fetchone()
    finally:
        conn.close()