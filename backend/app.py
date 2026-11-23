
import os
from pathlib import Path
from datetime import timedelta

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from sqlalchemy import text
from werkzeug.security import check_password_hash
from dotenv import load_dotenv

from database import engine


# Carrega as variáveis privadas do backend/.env
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)

# Chave utilizada para proteger as sessões
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

if not app.config["SECRET_KEY"]:
    raise RuntimeError("SECRET_KEY não configurada no arquivo .env")

# Configurações da sessão para desenvolvimento local
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = False
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=8)

# Permite comunicação com o frontend local
CORS(
    app,
    origins=["http://127.0.0.1:3000"],
    supports_credentials=True
)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "message": "API da ONFACE funcionando!"
    }), 200


@app.route("/api/login", methods=["POST"])
def login():
    dados = request.get_json(silent=True) or {}

    email = dados.get("email", "").strip().lower()
    senha = dados.get("senha", "")

    if not email or not senha:
        return jsonify({
            "sucesso": False,
            "mensagem": "Informe o e-mail e a senha."
        }), 400

    try:
        with engine.begin() as connection:
            usuario = connection.execute(
                text("""
                    SELECT
                        id_usuario,
                        nome,
                        email,
                        senha_hash,
                        perfil,
                        ativo,
                        id_escola
                    FROM usuarios
                    WHERE email = :email
                    LIMIT 1
                """),
                {"email": email}
            ).mappings().first()

            if not usuario or not usuario["ativo"]:
                return jsonify({
                    "sucesso": False,
                    "mensagem": "E-mail ou senha incorretos."
                }), 401

            if not check_password_hash(usuario["senha_hash"], senha):
                return jsonify({
                    "sucesso": False,
                    "mensagem": "E-mail ou senha incorretos."
                }), 401

            connection.execute(
                text("""
                    UPDATE usuarios
                    SET ultimo_acesso = CURRENT_TIMESTAMP
                    WHERE id_usuario = :id
                """),
                {"id": usuario["id_usuario"]}
            )

            # Cria a sessão autenticada
            session.clear()
            session["usuario_id"] = usuario["id_usuario"]
            session.permanent = True

            return jsonify({
                "sucesso": True,
                "mensagem": "Login realizado com sucesso!",
                "usuario": {
                    "id_usuario": usuario["id_usuario"],
                    "nome": usuario["nome"],
                    "email": usuario["email"],
                    "perfil": usuario["perfil"],
                    "id_escola": usuario["id_escola"]
                }
            }), 200

    except Exception as erro:
        print("Erro na autenticação:", erro)

        return jsonify({
            "sucesso": False,
            "mensagem": "Erro interno ao realizar o login."
        }), 500


@app.route("/api/me", methods=["GET"])
def usuario_logado():
    usuario_id = session.get("usuario_id")

    if not usuario_id:
        return jsonify({
            "autenticado": False,
            "mensagem": "Usuário não autenticado."
        }), 401

    try:
        with engine.connect() as connection:
            usuario = connection.execute(
                text("""
                    SELECT
                        id_usuario,
                        nome,
                        email,
                        perfil,
                        ativo,
                        id_escola
                    FROM usuarios
                    WHERE id_usuario = :id
                    LIMIT 1
                """),
                {"id": usuario_id}
            ).mappings().first()

        if not usuario or not usuario["ativo"]:
            session.clear()

            return jsonify({
                "autenticado": False,
                "mensagem": "Sessão inválida."
            }), 401

        return jsonify({
            "autenticado": True,
            "usuario": {
                "id_usuario": usuario["id_usuario"],
                "nome": usuario["nome"],
                "email": usuario["email"],
                "perfil": usuario["perfil"],
                "id_escola": usuario["id_escola"]
            }
        }), 200

    except Exception as erro:
        print("Erro ao consultar sessão:", erro)

        return jsonify({
            "mensagem": "Erro ao consultar a sessão."
        }), 500


@app.route("/api/responsavel/alunos", methods=["GET"])
def alunos_do_responsavel():
    usuario_id = session.get("usuario_id")

    # Verifica se existe uma sessão autenticada
    if not usuario_id:
        return jsonify({
            "sucesso": False,
            "mensagem": "Usuário não autenticado."
        }), 401

    try:
        with engine.connect() as connection:

            # Confirma que o usuário é um responsável ativo
            usuario = connection.execute(
                text("""
                    SELECT id_usuario, id_escola
                    FROM usuarios
                    WHERE id_usuario = :id
                      AND perfil = 'RESPONSAVEL'
                      AND ativo = 1
                    LIMIT 1
                """),
                {"id": usuario_id}
            ).mappings().first()

            if not usuario:
                return jsonify({
                    "sucesso": False,
                    "mensagem": "Acesso permitido somente para responsáveis."
                }), 403

            # Busca somente os alunos vinculados a esse responsável
            resultado = connection.execute(
                text("""
                    SELECT
                        a.id_aluno,
                        a.matricula,
                        a.nome,
                        DATE_FORMAT(a.data_nascimento, '%Y-%m-%d')
                            AS data_nascimento,
                        a.status,
                        ar.parentesco,
                        ar.responsavel_principal
                    FROM responsaveis r
                    INNER JOIN aluno_responsavel ar
                        ON ar.id_responsavel = r.id_responsavel
                    INNER JOIN alunos a
                        ON a.id_aluno = ar.id_aluno
                    WHERE r.id_usuario = :usuario_id
                      AND a.id_escola = :escola_id
                    ORDER BY a.nome
                """),
                {
                    "usuario_id": usuario_id,
                    "escola_id": usuario["id_escola"]
                }
            ).mappings().all()

            alunos = [dict(aluno) for aluno in resultado]

        return jsonify({
            "sucesso": True,
            "quantidade": len(alunos),
            "alunos": alunos
        }), 200

    except Exception as erro:
        print("Erro ao buscar alunos do responsável:", erro)

        return jsonify({
            "sucesso": False,
            "mensagem": "Erro ao consultar os alunos vinculados."
        }), 500

@app.route("/api/responsavel/frequencia", methods=["GET"])
def frequencia_responsavel():
    usuario_id = session.get("usuario_id")

    if not usuario_id:
        return jsonify({
            "sucesso": False,
            "mensagem": "Usuário não autenticado."
        }), 401

    try:
        with engine.connect() as connection:
            resultado = connection.execute(
                text("""
                    SELECT
                        al.id_aluno,
                        al.nome AS aluno,
                        DATE_FORMAT(a.data_aula, '%Y-%m-%d') AS data_aula,
                        TIME_FORMAT(a.horario_inicio, '%H:%i:%s') AS horario_inicio,
                        TIME_FORMAT(a.horario_fim, '%H:%i:%s') AS horario_fim,
                        d.nome AS disciplina,
                        t.nome AS turma,
                        rp.status AS situacao,
                        rp.origem,
                        DATE_FORMAT(
                            rp.data_hora_registro,
                            '%Y-%m-%d %H:%i:%s'
                        ) AS data_hora_registro,
                        rp.justificativa,
                        lp.status AS status_lista

                    FROM registros_presenca rp

                    INNER JOIN alunos al
                        ON al.id_aluno = rp.id_aluno

                    INNER JOIN listas_presenca lp
                        ON lp.id_lista = rp.id_lista

                    INNER JOIN aulas a
                        ON a.id_aula = lp.id_aula

                    INNER JOIN disciplinas d
                        ON d.id_disciplina = a.id_disciplina

                    INNER JOIN turmas t
                        ON t.id_turma = a.id_turma

                    INNER JOIN aluno_responsavel ar
                        ON ar.id_aluno = al.id_aluno

                    INNER JOIN responsaveis r
                        ON r.id_responsavel = ar.id_responsavel

                    INNER JOIN usuarios u
                        ON u.id_usuario = r.id_usuario

                    WHERE r.id_usuario = :usuario_id
                      AND u.perfil = 'RESPONSAVEL'
                      AND u.ativo = 1
                      AND al.id_escola = u.id_escola
                      AND lp.status IN ('FECHADA', 'REVISADA')

                    ORDER BY a.data_aula DESC, a.horario_inicio DESC
                """),
                {"usuario_id": usuario_id}
            ).mappings().all()

            registros = [dict(item) for item in resultado]

        return jsonify({
            "sucesso": True,
            "quantidade": len(registros),
            "registros": registros
        }), 200

    except Exception as erro:
        print("Erro ao buscar frequência do responsável:", erro)

        return jsonify({
            "sucesso": False,
            "mensagem": "Erro ao consultar a frequência."
        }), 500

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()

    return jsonify({
        "sucesso": True,
        "mensagem": "Sessão encerrada com sucesso."
    }), 200


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )
