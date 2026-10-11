from routes.test_routes import test_bp


def register_routes(app):
    app.register_blueprint(test_bp, url_prefix="/api")