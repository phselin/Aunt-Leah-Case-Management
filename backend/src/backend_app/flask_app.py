from flask import Flask, jsonify
from pymongo.errors import PyMongoError

from backend_app.db import get_examples_collection, get_mongo_client


def create_flask_app() -> Flask:
    app = Flask(__name__)

    @app.get("/example-route")
    def example_route():
        client = get_mongo_client()
        try:
            coll = get_examples_collection(client)
            doc = coll.find_one(sort=[("_id", -1)])
            message = doc["message"] if doc else "Hello, World!"
            return jsonify({"status": "ok", "framework": "flask", "message": message})
        except PyMongoError:
            return (
                jsonify(
                    {
                        "status": "error",
                        "framework": "flask",
                        "message": "MongoDB unavailable",
                    }
                ),
                503,
            )
        finally:
            client.close()

    return app


if __name__ == "__main__":
    app = create_flask_app()
    app.run(debug=True)
