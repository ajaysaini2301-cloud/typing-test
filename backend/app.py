import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
import os

from routes import register_routes

# backend folder ki .env file load karo
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))


def create_app():
    app = Flask(__name__)

    # React (Vite) frontend ko API access dene ke liye
    frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    CORS(app, resources={r"/api/*": {"origins": frontend_origin}})

    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "")

    if not app.config["JWT_SECRET_KEY"]:
        raise RuntimeError("JWT_SECRET_KEY is missing from .env")

    # Saare blueprints register karo
    register_routes(app)

    # Common error responses
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Route not found"}), 404

    @app.errorhandler(500)
    def server_error(error):
        return jsonify({"error": "Internal server error"}), 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=int(os.getenv("PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "1") == "1",
    )