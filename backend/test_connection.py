
from sqlalchemy import text
from database import engine

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("Resultado:", result.scalar())
        print("Conexão com o MySQL ONFACE realizada com sucesso!")

except Exception as error:
    print("Não foi possível conectar ao MySQL.")
    print("Detalhes:", error)

finally:
    engine.dispose()
