from routes.test_routes import test_bp
from routes.learning_routes import learning_bp
from routes.auth_routes import auth_bp



def register_routes(app):
    app.register_blueprint(test_bp, url_prefix="/api")
    app.register_blueprint(learning_bp, url_prefix="/api/learning")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")