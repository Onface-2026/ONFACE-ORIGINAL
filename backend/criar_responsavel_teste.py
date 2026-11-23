
from getpass import getpass

from sqlalchemy import text
from werkzeug.security import generate_password_hash

from database import engine


NOME = "Responsável Teste"
EMAIL = "responsavel.teste@onface.com.br"
ID_ESCOLA = 1
IDS_ALUNOS = [1, 2]


def main():
    senha = getpass("Crie a senha do responsável: ")
    confirmacao = getpass("Confirme a senha: ")

    if senha != confirmacao:
        print("As senhas não coincidem.")
        return

    if len(senha) < 10:
        print("A senha precisa ter pelo menos 10 caracteres.")
        return

    senha_hash = generate_password_hash(senha)

    try:
        with engine.begin() as connection:

            existente = connection.execute(
                text("""
                    SELECT id_usuario
                    FROM usuarios
                    WHERE email = :email
                """),
                {"email": EMAIL}
            ).first()

            if existente:
                print("Já existe um usuário com esse e-mail.")
                return

            escola = connection.execute(
                text("""
                    SELECT id_escola
                    FROM escolas
                    WHERE id_escola = :id
                """),
                {"id": ID_ESCOLA}
            ).first()

            if not escola:
                print("Escola de teste não encontrada.")
                return

            alunos = connection.execute(
                text("""
                    SELECT id_aluno
                    FROM alunos
                    WHERE id_aluno IN (1, 2)
                      AND id_escola = :escola
                """),
                {"escola": ID_ESCOLA}
            ).fetchall()

            if len(alunos) != len(IDS_ALUNOS):
                print("Não foi possível confirmar os dois alunos.")
                return

            resultado = connection.execute(
                text("""
                    INSERT INTO usuarios
                        (nome, email, senha_hash, perfil, ativo, id_escola)
                    VALUES
                        (:nome, :email, :senha_hash,
                         'RESPONSAVEL', 1, :escola)
                """),
                {
                    "nome": NOME,
                    "email": EMAIL,
                    "senha_hash": senha_hash,
                    "escola": ID_ESCOLA
                }
            )

            id_usuario = resultado.lastrowid

            resultado = connection.execute(
                text("""
                    INSERT INTO responsaveis (id_usuario)
                    VALUES (:id_usuario)
                """),
                {"id_usuario": id_usuario}
            )

            id_responsavel = resultado.lastrowid

            for id_aluno in IDS_ALUNOS:
                connection.execute(
                    text("""
                        INSERT INTO aluno_responsavel
                            (id_aluno, id_responsavel,
                             parentesco, responsavel_principal)
                        VALUES
                            (:aluno, :responsavel, 'Responsável', 1)
                    """),
                    {
                        "aluno": id_aluno,
                        "responsavel": id_responsavel
                    }
                )

        print("\nResponsável cadastrado com sucesso!")
        print("E-mail:", EMAIL)
        print("ID do usuário:", id_usuario)
        print("ID do responsável:", id_responsavel)
        print("Alunos vinculados:", IDS_ALUNOS)

    except Exception as erro:
        print("Erro no cadastro. Nenhuma alteração foi confirmada.")
        print(erro)


if __name__ == "__main__":
    main()
