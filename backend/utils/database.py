
import os

import pymysql
from pymysql.cursors import DictCursor
from dotenv import load_dotenv

# backend folder ki .env file load karo
BACKEND_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

ENV_PATH = os.path.join(BACKEND_DIR, ".env")
load_dotenv(ENV_PATH)


def get_db_connection():
    """
    MySQL database connection create karta hai.
    Successful connection return karta hai.
    Connection fail hone par exception raise hoti hai.
    """
    connection = pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        cursorclass=DictCursor,
        connect_timeout=5,
        charset="utf8mb4",
        autocommit=False,
    )

    return connection
