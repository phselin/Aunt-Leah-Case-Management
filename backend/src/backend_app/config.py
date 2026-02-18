from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    mongo_uri: str = "mongodb://mongo:27017/auntleah"
    redis_url: str = "redis://redis:6379/0"

    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/0"

    gotenberg_url: str = "http://gotenberg:3000"

    # zitadel_url: str = "http://zitadel:8080"

    output_dir: str = "/outputs"

    JWT_SECRET_KEY: str = "b14f651eee210eb2d15f205c20b9e8fc412815dadd1b3296030769d428a38922" # maybe in .env?


settings = Settings()
