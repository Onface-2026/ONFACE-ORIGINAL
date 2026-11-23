
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, URL

# Localiza o arquivo .env dentro da pasta backend
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# Monta a conexão com o MySQL
database_url = URL.create(
    drivername="mysql+pymysql",
    username=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=int(os.getenv("DB_PORT", "3306")),
    database=os.getenv("DB_NAME"),
)

engine = create_engine(
    database_url,
    pool_pre_ping=True,
    echo=False
)
