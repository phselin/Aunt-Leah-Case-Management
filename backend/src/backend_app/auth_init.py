from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask import g
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

bcrypt = Bcrypt()
jwt = JWTManager()
limiter = Limiter(key_func=lambda: str(g.user["_id"]) if g.get("user") else get_remote_address(), default_limits=["30 per minute"])
