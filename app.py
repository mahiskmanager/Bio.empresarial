#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
============================================================
ARCHIVO: app.py
PROYECTO: Biografía Douglas Esteban Esquivel
DESCRIPCIÓN: Servidor web Python con Flask - API REST completa
VERSIÓN: 1.0.0
AUTOR: Douglas Esteban Esquivel
============================================================

TABLA DE CONTENIDO:
1.  Importaciones y configuración
2.  Constantes y datos personales
3.  Clases de modelo (Proyecto, Habilidad, MensajeContacto)
4.  Gestión de base de datos (SQLite)
5.  Inicialización de la aplicación Flask
6.  Rutas de páginas (HTML)
7.  API REST - Endpoints de información
8.  API REST - Endpoints de proyectos
9.  API REST - Endpoints de habilidades
10. API REST - Endpoints de contacto
11. API REST - Endpoints de galería
12. Utilidades y helpers
13. Manejo de errores
14. Middleware y seguridad
15. Configuración de logging
16. Función principal y ejecución
============================================================
"""

# ============================================================
# 1. IMPORTACIONES Y CONFIGURACIÓN
# ============================================================

import os
import sys
import json
import sqlite3
import logging
import smtplib
import hashlib
import datetime
import re
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from functools import wraps
from urllib.parse import urlparse

# Intentar importar Flask; si no está instalado, dar instrucciones
try:
    from flask import (
        Flask, render_template, request, jsonify,
        redirect, url_for, send_from_directory, abort,
        make_response, session
    )
    from flask_cors import CORS
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False
    print("=" * 60)
    print("ADVERTENCIA: Flask no está instalado.")
    print("Instala las dependencias con:")
    print("  pip install flask flask-cors")
    print("=" * 60)

# ============================================================
# 2. CONSTANTES Y DATOS PERSONALES
# ============================================================

# Datos personales de Douglas Esteban Esquivel
PERSONAL_INFO = {
    "nombre": "Douglas Esteban Esquivel",
    "edad": 19,
    "email": "duglaspro7@gmail.com",
    "telefono": "39875180",
    "telefono_formateado": "+502 3987 5180",
    "empresa": "D'ouglas Company",
    "ubicacion": "Guatemala, Centroamérica",
    "frase_motivacional": (
        "Aprende, estudia, crea. Todos tenemos un propósito: "
        "haz lo que te inspira sin dañar a terceros."
    ),
    "conocimiento": "Conocimiento empírico en programación y bases de datos",
    "proyectos_completados": 5,
    "video_youtube": "https://youtu.be/2eB6B6ZeOGA?si=-NYqDFnt4txBL5rL",
    "redes_sociales": {
        "youtube_canal": "https://youtube.com/@ftismael?si=GP2YUON5eLshXhvY",
        "instagram": "https://www.instagram.com/ismael_e12?psln=Zjd5N2doYjR4MnVk",
        "facebook": "https://www.facebook.com/share/1BUmVay3So/",
        "linkedin": (
            "https://www.linkedin.com/in/douglas-esteban-esquivel-a81710262"
            "?utm_source=share_via&utm_content=profile&utm_medium=member_android"
        )
    }
}

# Configuración de la aplicación
BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "data" / "portafolio.db"
UPLOAD_FOLDER = BASE_DIR / "fotos"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB

# Configuración de seguridad
SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'douglas-esquivel-portfolio-secret-key-2024'
)
SESSION_COOKIE_SECURE = False  # Cambiar a True en producción con HTTPS
PERMANENT_SESSION_LIFETIME = datetime.timedelta(hours=2)

# ============================================================
# 3. CLASES DE MODELO
# ============================================================

class Proyecto:
    """Clase que representa un proyecto del portafolio."""

    def __init__(self, id_proyecto, titulo, descripcion, categoria,
                 tecnologias, url_github=None, url_demo=None,
                 fecha_creacion=None, destacado=False):
        self.id = id_proyecto
        self.titulo = titulo
        self.descripcion = descripcion
        self.categoria = categoria
        self.tecnologias = tecnologias if isinstance(tecnologias, list) else [tecnologias]
        self.url_github = url_github
        self.url_demo = url_demo
        self.fecha_creacion = fecha_creacion or datetime.datetime.now().isoformat()
        self.destacado = destacado

    def to_dict(self):
        """Convierte el proyecto a diccionario para serialización JSON."""
        return {
            "id": self.id,
            "titulo": self.titulo,
            "descripcion": self.descripcion,
            "categoria": self.categoria,
            "tecnologias": self.tecnologias,
            "url_github": self.url_github,
            "url_demo": self.url_demo,
            "fecha_creacion": self.fecha_creacion,
            "destacado": self.destacado
        }

    @classmethod
    def from_dict(cls, data):
        """Crea una instancia de Proyecto desde un diccionario."""
        return cls(
            id_proyecto=data.get('id'),
            titulo=data.get('titulo', ''),
            descripcion=data.get('descripcion', ''),
            categoria=data.get('categoria', 'general'),
            tecnologias=data.get('tecnologias', []),
            url_github=data.get('url_github'),
            url_demo=data.get('url_demo'),
            fecha_creacion=data.get('fecha_creacion'),
            destacado=data.get('destacado', False)
        )

    def __repr__(self):
        return f"<Proyecto {self.id}: {self.titulo}>"


class Habilidad:
    """Clase que representa una habilidad técnica."""

    def __init__(self, nombre, nivel, categoria, descripcion=""):
        self.nombre = nombre
        self.nivel = nivel  # 0-100
        self.categoria = categoria
        self.descripcion = descripcion

    def to_dict(self):
        return {
            "nombre": self.nombre,
            "nivel": self.nivel,
            "categoria": self.categoria,
            "descripcion": self.descripcion
        }

    def validar(self):
        """Valida que los datos de la habilidad sean correctos."""
        if not self.nombre or len(self.nombre.strip()) == 0:
            raise ValueError("El nombre de la habilidad no puede estar vacío")
        if not (0 <= self.nivel <= 100):
            raise ValueError("El nivel debe estar entre 0 y 100")
        return True


class MensajeContacto:
    """Clase que representa un mensaje del formulario de contacto."""

    def __init__(self, nombre, email, asunto, mensaje, fecha=None,
                 id_mensaje=None, leido=False):
        self.id = id_mensaje
        self.nombre = nombre
        self.email = email
        self.asunto = asunto
        self.mensaje = mensaje
        self.fecha = fecha or datetime.datetime.now().isoformat()
        self.leido = leido

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "email": self.email,
            "asunto": self.asunto,
            "mensaje": self.mensaje,
            "fecha": self.fecha,
            "leido": self.leido
        }

    def validar(self):
        """Valida los campos del mensaje de contacto."""
        errores = []

        if not self.nombre or len(self.nombre.strip()) < 2:
            errores.append("El nombre debe tener al menos 2 caracteres")

        if not self.email or not self._email_valido(self.email):
            errores.append("El email no es válido")

        if not self.asunto or len(self.asunto.strip()) < 3:
            errores.append("El asunto debe tener al menos 3 caracteres")

        if not self.mensaje or len(self.mensaje.strip()) < 10:
            errores.append("El mensaje debe tener al menos 10 caracteres")

        return errores

    @staticmethod
    def _email_valido(email):
        """Valida el formato de un email con regex."""
        patron = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        return re.match(patron, email) is not None

    def __repr__(self):
        return f"<MensajeContacto de {self.nombre}: {self.asunto}>"


# ============================================================
# 4. GESTIÓN DE BASE DE DATOS (SQLite)
# ============================================================

class DatabaseManager:
    """Gestor de base de datos SQLite para el portafolio."""

    def __init__(self, db_path):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.inicializar_db()

    def obtener_conexion(self):
        """Obtiene una conexión a la base de datos."""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def inicializar_db(self):
        """Crea las tablas si no existen."""
        conn = self.obtener_conexion()
        cursor = conn.cursor()

        # Tabla de proyectos
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS proyectos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                descripcion TEXT NOT NULL,
                categoria TEXT NOT NULL,
                tecnologias TEXT NOT NULL,
                url_github TEXT,
                url_demo TEXT,
                fecha_creacion TEXT NOT NULL,
                destacado INTEGER DEFAULT 0
            )
        ''')

        # Tabla de mensajes de contacto
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS mensajes_contacto (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                email TEXT NOT NULL,
                asunto TEXT NOT NULL,
                mensaje TEXT NOT NULL,
                fecha TEXT NOT NULL,
                leido INTEGER DEFAULT 0
            )
        ''')

        # Tabla de habilidades
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS habilidades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                nivel INTEGER NOT NULL,
                categoria TEXT NOT NULL,
                descripcion TEXT
            )
        ''')

        # Tabla de visitas (analytics básico)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS visitas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fecha TEXT NOT NULL,
                ip TEXT,
                user_agent TEXT,
                pagina TEXT
            )
        ''')

        conn.commit()
        conn.close()

        # Insertar datos iniciales si la tabla está vacía
        self._insertar_datos_iniciales()

    def _insertar_datos_iniciales(self):
        """Inserta proyectos y habilidades de ejemplo si la BD está vacía."""
        conn = self.obtener_conexion()
        cursor = conn.cursor()

        # Verificar si ya hay proyectos
        cursor.execute("SELECT COUNT(*) as count FROM proyectos")
        if cursor.fetchone()['count'] == 0:
            proyectos_iniciales = [
                Proyecto(
                    None, "Sistema de Gestión Empresarial",
                    "Plataforma web completa para gestión de inventarios, ventas y reportes en tiempo real.",
                    "web", ["HTML", "CSS", "JavaScript", "MySQL"],
                    fecha_creacion="2024-06-15", destacado=True
                ),
                Proyecto(
                    None, "Diseño de BD para Clínica",
                    "Modelo entidad-relación y base de datos normalizada para gestión de pacientes.",
                    "bd", ["MySQL", "SQL", "ERD"],
                    fecha_creacion="2024-08-20", destacado=True
                ),
                Proyecto(
                    None, "App de Tareas y Productividad",
                    "Aplicación de gestión de tareas con recordatorios y sincronización en la nube.",
                    "app", ["Python", "Flask", "SQLite"],
                    fecha_creacion="2024-10-01", destacado=False
                ),
                Proyecto(
                    None, "Tienda en Línea",
                    "Plataforma de e-commerce con carrito de compras y panel de administración.",
                    "web", ["PHP", "MySQL", "Bootstrap"],
                    fecha_creacion="2025-01-10", destacado=True
                ),
                Proyecto(
                    None, "Sistema de Reportes",
                    "Generador de reportes automatizados con visualización de datos.",
                    "bd", ["Python", "SQL", "Charts"],
                    fecha_creacion="2025-03-05", destacado=False
                ),
                Proyecto(
                    None, "Chat en Tiempo Real",
                    "Aplicación de mensajería con salas y notificaciones push.",
                    "app", ["Node.js", "WebSocket", "MongoDB"],
                    fecha_creacion="2025-05-20", destacado=False
                )
            ]

            for p in proyectos_iniciales:
                cursor.execute('''
                    INSERT INTO proyectos (titulo, descripcion, categoria, tecnologias,
                                          url_github, url_demo, fecha_creacion, destacado)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    p.titulo, p.descripcion, p.categoria,
                    json.dumps(p.tecnologias), p.url_github, p.url_demo,
                    p.fecha_creacion, 1 if p.destacado else 0
                ))

        # Verificar habilidades
        cursor.execute("SELECT COUNT(*) as count FROM habilidades")
        if cursor.fetchone()['count'] == 0:
            habilidades_iniciales = [
                ("Desarrollo Web Frontend", 85, "Programación", "HTML5, CSS3, JavaScript"),
                ("Desarrollo Backend", 80, "Programación", "APIs REST, lógica de servidor"),
                ("Python", 75, "Programación", "Flask, automatización, scripting"),
                ("JavaScript", 82, "Programación", "ES6+, DOM, AJAX"),
                ("MySQL", 88, "Bases de Datos", "Consultas, stored procedures"),
                ("Diseño de BD", 85, "Bases de Datos", "Modelado ER, normalización"),
                ("SQL Avanzado", 80, "Bases de Datos", "Joins, subconsultas, índices"),
                ("Optimización de Consultas", 75, "Bases de Datos", "EXPLAIN, tuning de rendimiento")
            ]

            for h in habilidades_iniciales:
                cursor.execute('''
                    INSERT INTO habilidades (nombre, nivel, categoria, descripcion)
                    VALUES (?, ?, ?, ?)
                ''', h)

        conn.commit()
        conn.close()

    # --- Métodos para Proyectos ---
    def obtener_proyectos(self, categoria=None, destacado=None):
        """Obtiene proyectos, opcionalmente filtrados."""
        conn = self.obtener_conexion()
        cursor = conn.cursor()

        query = "SELECT * FROM proyectos WHERE 1=1"
        params = []

        if categoria and categoria != "todos":
            query += " AND categoria = ?"
            params.append(categoria)

        if destacado is not None:
            query += " AND destacado = ?"
            params.append(1 if destacado else 0)

        query += " ORDER BY fecha_creacion DESC"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        proyectos = []
        for row in rows:
            p = dict(row)
            p['tecnologias'] = json.loads(p['tecnologias'])
            p['destacado'] = bool(p['destacado'])
            proyectos.append(p)

        return proyectos

    def obtener_proyecto_por_id(self, id_proyecto):
        """Obtiene un proyecto por su ID."""
        conn = self.obtener_conexion()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM proyectos WHERE id = ?", (id_proyecto,))
        row = cursor.fetchone()
        conn.close()

        if row:
            p = dict(row)
            p['tecnologias'] = json.loads(p['tecnologias'])
            p['destacado'] = bool(p['destacado'])
            return p
        return None

    def agregar_proyecto(self, proyecto):
        """Agrega un nuevo proyecto a la base de datos."""
        conn = self.obtener_conexion()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO proyectos (titulo, descripcion, categoria, tecnologias,
                                  url_github, url_demo, fecha_creacion, destacado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            proyecto.titulo, proyecto.descripcion, proyecto.categoria,
            json.dumps(proyecto.tecnologias), proyecto.url_github, proyecto.url_demo,
            proyecto.fecha_creacion, 1 if proyecto.destacado else 0
        ))
        conn.commit()
        nuevo_id = cursor.lastrowid
        conn.close()
        return nuevo_id

    def eliminar_proyecto(self, id_proyecto):
        """Elimina un proyecto por su ID."""
        conn = self.obtener_conexion()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM proyectos WHERE id = ?", (id_proyecto,))
        eliminados = cursor.rowcount
        conn.commit()
        conn.close()
        return eliminados > 0

    # --- Métodos para Mensajes de Contacto ---
    def agregar_mensaje(self, mensaje):
        """Guarda un mensaje de contacto en la BD."""
        conn = self.obtener_conexion()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO mensajes_contacto (nombre, email, asunto, mensaje, fecha, leido)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (mensaje.nombre, mensaje.email, mensaje.asunto,
              mensaje.mensaje, mensaje.fecha, 0))
        conn.commit()
        nuevo_id = cursor.lastrowid
        conn.close()
        return nuevo_id

    def obtener_mensajes(self, solo_no_leidos=False):
        """Obtiene todos los mensajes de contacto."""
        conn = self.obtener_conexion()
        cursor = conn.cursor()

        if solo_no_leidos:
            cursor.execute(
                "SELECT * FROM mensajes_contacto WHERE leido = 0 ORDER BY fecha DESC"
            )
        else:
            cursor.execute(
                "SELECT * FROM mensajes_contacto ORDER BY fecha DESC"
            )

        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def marcar_mensaje_leido(self, id_mensaje):
        """Marca un mensaje como leído."""
        conn = self.obtener_conexion()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE mensajes_contacto SET leido = 1 WHERE id = ?",
            (id_mensaje,)
        )
        conn.commit()
        actualizados = cursor.rowcount
        conn.close()
        return actualizados > 0

    # --- Métodos para Habilidades ---
    def obtener_habilidades(self, categoria=None):
        """Obtiene habilidades, opcionalmente por categoría."""
        conn = self.obtener_conexion()
        cursor = conn.cursor()

        if categoria:
            cursor.execute(
                "SELECT * FROM habilidades WHERE categoria = ? ORDER BY nivel DESC",
                (categoria,)
            )
        else:
            cursor.execute("SELECT * FROM habilidades ORDER BY categoria, nivel DESC")

        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    # --- Métodos para Visitas ---
    def registrar_visita(self, ip, user_agent, pagina):
        """Registra una visita al sitio."""
        conn = self.obtener_conexion()
        cursor = conn.cursor()
        fecha = datetime.datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO visitas (fecha, ip, user_agent, pagina)
            VALUES (?, ?, ?, ?)
        ''', (fecha, ip, user_agent, pagina))
        conn.commit()
        conn.close()

    def obtener_estadisticas_visitas(self):
        """Obtiene estadísticas básicas de visitas."""
        conn = self.obtener_conexion()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) as total FROM visitas")
        total = cursor.fetchone()['total']

        cursor.execute('''
            SELECT COUNT(DISTINCT ip) as visitas_unicas FROM visitas
        ''')
        unicas = cursor.fetchone()['visitas_unicas']

        cursor.execute('''
            SELECT pagina, COUNT(*) as count FROM visitas
            GROUP BY pagina ORDER BY count DESC LIMIT 5
        ''')
        top_paginas = [dict(row) for row in cursor.fetchall()]

        conn.close()
        return {
            "total_visitas": total,
            "visitas_unicas": unicas,
            "top_paginas": top_paginas
        }


# ============================================================
# 5. INICIALIZACIÓN DE LA APLICACIÓN FLASK
# ============================================================

def create_app():
    """Crea y configura la aplicación Flask."""

    if not FLASK_AVAILABLE:
        print("Flask no disponible. Ejecutando en modo solo datos.")
        return None

    app = Flask(__name__,
                static_folder=str(BASE_DIR),
                static_url_path='',
                template_folder=str(BASE_DIR))

    # Configuración básica
    app.config['SECRET_KEY'] = SECRET_KEY
    app.config['SESSION_COOKIE_SECURE'] = SESSION_COOKIE_SECURE
    app.config['PERMANENT_SESSION_LIFETIME'] = PERMANENT_SESSION_LIFETIME
    app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH
    app.config['UPLOAD_FOLDER'] = str(UPLOAD_FOLDER)

    # Habilitar CORS para desarrollo
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Inicializar base de datos
    db = DatabaseManager(DATABASE_PATH)
    app.db = db

    # Configurar logging
    configurar_logging(app)

    # Registrar rutas
    registrar_rutas(app)

    # Registrar manejadores de error
    registrar_errores(app)

    return app


# ============================================================
# 6. RUTAS DE PÁGINAS (HTML)
# ============================================================

def registrar_rutas(app):
    """Registra todas las rutas de la aplicación."""

    @app.route('/')
    def index():
        """Página principal - sirve el index.html."""
        # Registrar visita
        try:
            app.db.registrar_visita(
                ip=request.remote_addr,
                user_agent=request.headers.get('User-Agent', ''),
                pagina='/'
            )
        except Exception:
            pass

        return send_from_directory(str(BASE_DIR), 'index.html')

    @app.route('/<path:filename>')
    def static_files(filename):
        """Sirve archivos estáticos (CSS, JS, imágenes)."""
        # Seguridad: prevenir path traversal
        if '..' in filename or filename.startswith('/'):
            abort(404)

        file_path = BASE_DIR / filename
        if file_path.exists() and file_path.is_file():
            return send_from_directory(str(BASE_DIR), filename)
        abort(404)

    @app.route('/fotos/<path:filename>')
    def servir_foto(filename):
        """Sirve fotos de la galería."""
        if '..' in filename:
            abort(404)

        foto_path = UPLOAD_FOLDER / filename
        if foto_path.exists() and foto_path.is_file():
            return send_from_directory(str(UPLOAD_FOLDER), filename)
        abort(404)

    # ============================================================
    # 7. API REST - ENDPOINTS DE INFORMACIÓN
    # ============================================================

    @app.route('/api/info', methods=['GET'])
    def api_info_personal():
        """Devuelve la información personal."""
        return jsonify({
            "status": "success",
            "data": PERSONAL_INFO,
            "timestamp": datetime.datetime.now().isoformat()
        })

    @app.route('/api/info/redes', methods=['GET'])
    def api_redes_sociales():
        """Devuelve solo las redes sociales."""
        return jsonify({
            "status": "success",
            "data": PERSONAL_INFO["redes_sociales"]
        })

    @app.route('/api/estadisticas', methods=['GET'])
    def api_estadisticas():
        """Devuelve estadísticas del sitio."""
        stats = app.db.obtener_estadisticas_visitas()
        proyectos = app.db.obtener_proyectos()
        habilidades = app.db.obtener_habilidades()

        return jsonify({
            "status": "success",
            "data": {
                "visitas": stats,
                "total_proyectos": len(proyectos),
                "total_habilidades": len(habilidades),
                "proyectos_destacados": len([p for p in proyectos if p.get('destacado')])
            }
        })

    # ============================================================
    # 8. API REST - ENDPOINTS DE PROYECTOS
    # ============================================================

    @app.route('/api/proyectos', methods=['GET'])
    def api_obtener_proyectos():
        """Obtiene todos los proyectos, con filtro opcional por categoría."""
        categoria = request.args.get('categoria', 'todos')
        destacado = request.args.get('destacado')

        destacado_bool = None
        if destacado is not None:
            destacado_bool = destacado.lower() in ('true', '1', 'yes')

        proyectos = app.db.obtener_proyectos(
            categoria=categoria,
            destacado=destacado_bool
        )

        return jsonify({
            "status": "success",
            "count": len(proyectos),
            "data": proyectos
        })

    @app.route('/api/proyectos/<int:id_proyecto>', methods=['GET'])
    def api_obtener_proyecto(id_proyecto):
        """Obtiene un proyecto específico por ID."""
        proyecto = app.db.obtener_proyecto_por_id(id_proyecto)
        if proyecto:
            return jsonify({"status": "success", "data": proyecto})
        return jsonify({
            "status": "error",
            "message": "Proyecto no encontrado"
        }), 404

    @app.route('/api/proyectos', methods=['POST'])
    @requiere_autenticacion
    def api_crear_proyecto():
        """Crea un nuevo proyecto (requiere autenticación)."""
        datos = request.get_json()
        if not datos:
            return jsonify({"status": "error", "message": "Datos inválidos"}), 400

        try:
            proyecto = Proyecto.from_dict(datos)
            nuevo_id = app.db.agregar_proyecto(proyecto)
            return jsonify({
                "status": "success",
                "message": "Proyecto creado",
                "id": nuevo_id
            }), 201
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": f"Error al crear proyecto: {str(e)}"
            }), 500

    @app.route('/api/proyectos/<int:id_proyecto>', methods=['DELETE'])
    @requiere_autenticacion
    def api_eliminar_proyecto(id_proyecto):
        """Elimina un proyecto (requiere autenticación)."""
        if app.db.eliminar_proyecto(id_proyecto):
            return jsonify({"status": "success", "message": "Proyecto eliminado"})
        return jsonify({
            "status": "error",
            "message": "Proyecto no encontrado"
        }), 404

    # ============================================================
    # 9. API REST - ENDPOINTS DE HABILIDADES
    # ============================================================

    @app.route('/api/habilidades', methods=['GET'])
    def api_obtener_habilidades():
        """Obtiene todas las habilidades."""
        categoria = request.args.get('categoria')
        habilidades = app.db.obtener_habilidades(categoria)

        # Agrupar por categoría
        agrupadas = {}
        for h in habilidades:
            cat = h['categoria']
            if cat not in agrupadas:
                agrupadas[cat] = []
            agrupadas[cat].append(h)

        return jsonify({
            "status": "success",
            "count": len(habilidades),
            "data": agrupadas
        })

    # ============================================================
    # 10. API REST - ENDPOINTS DE CONTACTO
    # ============================================================

    @app.route('/api/contacto', methods=['POST'])
    def api_enviar_contacto():
        """Recibe y procesa un mensaje del formulario de contacto."""
        datos = request.get_json()

        if not datos:
            return jsonify({
                "status": "error",
                "message": "No se recibieron datos"
            }), 400

        mensaje = MensajeContacto(
            nombre=datos.get('nombre', ''),
            email=datos.get('email', ''),
            asunto=datos.get('asunto', ''),
            mensaje=datos.get('mensaje', '')
        )

        errores = mensaje.validar()
        if errores:
            return jsonify({
                "status": "error",
                "message": "Validación fallida",
                "errores": errores
            }), 400

        try:
            # Guardar en base de datos
            id_mensaje = app.db.agregar_mensaje(mensaje)

            # Intentar enviar email (si está configurado)
            email_enviado = enviar_email_notificacion(mensaje)

            app.logger.info(
                f"Mensaje de contacto recibido: #{id_mensaje} de {mensaje.nombre}"
            )

            return jsonify({
                "status": "success",
                "message": "Mensaje recibido correctamente",
                "id": id_mensaje,
                "email_enviado": email_enviado
            }), 201

        except Exception as e:
            app.logger.error(f"Error al procesar contacto: {str(e)}")
            return jsonify({
                "status": "error",
                "message": "Error interno al procesar el mensaje"
            }), 500

    @app.route('/api/contacto/mensajes', methods=['GET'])
    @requiere_autenticacion
    def api_ver_mensajes():
        """Ver mensajes de contacto (requiere autenticación)."""
        solo_no_leidos = request.args.get('no_leidos', 'false').lower() == 'true'
        mensajes = app.db.obtener_mensajes(solo_no_leidos=solo_no_leidos)

        return jsonify({
            "status": "success",
            "count": len(mensajes),
            "data": mensajes
        })

    @app.route('/api/contacto/mensajes/<int:id_mensaje>/leido', methods=['POST'])
    @requiere_autenticacion
    def api_marcar_leido(id_mensaje):
        """Marca un mensaje como leído."""
        if app.db.marcar_mensaje_leido(id_mensaje):
            return jsonify({"status": "success", "message": "Mensaje marcado como leído"})
        return jsonify({"status": "error", "message": "Mensaje no encontrado"}), 404

    # ============================================================
    # 11. API REST - ENDPOINTS DE GALERÍA
    # ============================================================

    @app.route('/api/galeria', methods=['GET'])
    def api_galeria():
        """Lista las fotos disponibles en la carpeta /fotos."""
        fotos = []
        if UPLOAD_FOLDER.exists():
            for archivo in sorted(UPLOAD_FOLDER.iterdir()):
                if archivo.suffix.lower().lstrip('.') in ALLOWED_EXTENSIONS:
                    fotos.append({
                        "nombre": archivo.name,
                        "url": f"/fotos/{archivo.name}",
                        "tamano": archivo.stat().st_size,
                        "fecha_modificacion": datetime.datetime.fromtimestamp(
                            archivo.stat().st_mtime
                        ).isoformat()
                    })

        return jsonify({
            "status": "success",
            "count": len(fotos),
            "data": fotos
        })

    @app.route('/api/galeria/subir', methods=['POST'])
    @requiere_autenticacion
    def api_subir_foto():
        """Sube una foto a la galería (requiere autenticación)."""
        if 'foto' not in request.files:
            return jsonify({"status": "error", "message": "No se envió ningún archivo"}), 400

        archivo = request.files['foto']
        if archivo.filename == '':
            return jsonify({"status": "error", "message": "Nombre de archivo vacío"}), 400

        if not archivo_permitido(archivo.filename):
            return jsonify({
                "status": "error",
                "message": f"Formato no permitido. Use: {', '.join(ALLOWED_EXTENSIONS)}"
            }), 400

        # Generar nombre seguro
        nombre_seguro = generar_nombre_seguro(archivo.filename)
        ruta_guardado = UPLOAD_FOLDER / nombre_seguro
        archivo.save(str(ruta_guardado))

        return jsonify({
            "status": "success",
            "message": "Foto subida correctamente",
            "url": f"/fotos/{nombre_seguro}"
        }), 201

    # ============================================================
    # 12. ENDPOINTS DE AUTENTICACIÓN (básicos)
    # ============================================================

    @app.route('/api/auth/login', methods=['POST'])
    def api_login():
        """Login básico para administración."""
        datos = request.get_json()
        usuario = datos.get('usuario', '')
        password = datos.get('password', '')

        # Hash simple de contraseña (en producción usar bcrypt)
        password_hash = hashlib.sha256(password.encode()).hexdigest()

        # Credenciales por defecto (cambiar en producción)
        usuario_admin = os.environ.get('ADMIN_USER', 'admin')
        password_admin_hash = hashlib.sha256(
            os.environ.get('ADMIN_PASS', 'admin123').encode()
        ).hexdigest()

        if usuario == usuario_admin and password_hash == password_admin_hash:
            session['autenticado'] = True
            session['usuario'] = usuario
            session.permanent = True
            return jsonify({"status": "success", "message": "Autenticación exitosa"})

        return jsonify({
            "status": "error",
            "message": "Credenciales inválidas"
        }), 401

    @app.route('/api/auth/logout', methods=['POST'])
    def api_logout():
        """Cierra la sesión de administración."""
        session.clear()
        return jsonify({"status": "success", "message": "Sesión cerrada"})

    @app.route('/api/auth/status', methods=['GET'])
    def api_auth_status():
        """Verifica el estado de autenticación."""
        return jsonify({
            "autenticado": session.get('autenticado', False),
            "usuario": session.get('usuario')
        })

    # ============================================================
    # 13. ENDPOINT DE SALUD (Health Check)
    # ============================================================

    @app.route('/api/health', methods=['GET'])
    def api_health():
        """Verifica que el servidor esté funcionando."""
        return jsonify({
            "status": "ok",
            "service": "Douglas Esquivel Portfolio API",
            "version": "1.0.0",
            "timestamp": datetime.datetime.now().isoformat(),
            "database": "connected" if app.db else "disconnected"
        })


# ============================================================
# 14. UTILIDADES Y HELPERS
# ============================================================

def requiere_autenticacion(f):
    """Decorador para proteger rutas que requieren login."""
    @wraps(f)
    def funcion_decorada(*args, **kwargs):
        if not session.get('autenticado', False):
            return jsonify({
                "status": "error",
                "message": "Autenticación requerida"
            }), 401
        return f(*args, **kwargs)
    return funcion_decorada


def archivo_permitido(nombre_archivo):
    """Verifica si un archivo tiene una extensión permitida."""
    return '.' in nombre_archivo and \
           nombre_archivo.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def generar_nombre_seguro(nombre_original):
    """Genera un nombre de archivo seguro y único."""
    extension = nombre_original.rsplit('.', 1)[1].lower()
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    hash_corto = hashlib.md5(nombre_original.encode()).hexdigest()[:8]
    return f"foto_{timestamp}_{hash_corto}.{extension}"


def enviar_email_notificacion(mensaje):
    """
    Envía un email de notificación cuando se recibe un mensaje.
    Requiere configuración de SMTP en variables de entorno.
    """
    smtp_server = os.environ.get('SMTP_SERVER')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_pass = os.environ.get('SMTP_PASS')

    if not all([smtp_server, smtp_user, smtp_pass]):
        return False  # SMTP no configurado

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = PERSONAL_INFO['email']
        msg['Subject'] = f"Nuevo mensaje de contacto: {mensaje.asunto}"

        cuerpo = f"""
        Nuevo mensaje recibido desde el portafolio web:

        Nombre: {mensaje.nombre}
        Email: {mensaje.email}
        Asunto: {mensaje.asunto}
        Fecha: {mensaje.fecha}

        Mensaje:
        {mensaje.mensaje}
        """

        msg.attach(MIMEText(cuerpo, 'plain', 'utf-8'))

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)

        return True
    except Exception as e:
        print(f"Error al enviar email: {e}")
        return False


def configurar_logging(app):
    """Configura el sistema de logging."""
    log_dir = BASE_DIR / "logs"
    log_dir.mkdir(exist_ok=True)

    log_file = log_dir / "app.log"

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(str(log_file)),
            logging.StreamHandler(sys.stdout)
        ]
    )

    app.logger.setLevel(logging.INFO)


# ============================================================
# 15. MANEJO DE ERRORES
# ============================================================

def registrar_errores(app):
    """Registra los manejadores de error personalizados."""

    @app.errorhandler(404)
    def not_found(error):
        if request.path.startswith('/api/'):
            return jsonify({
                "status": "error",
                "message": "Endpoint no encontrado"
            }), 404
        return send_from_directory(str(BASE_DIR), 'index.html'), 404

    @app.errorhandler(413)
    def archivo_demasiado_grande(error):
        return jsonify({
            "status": "error",
            "message": "El archivo es demasiado grande (máx 16MB)"
        }), 413

    @app.errorhandler(500)
    def error_interno(error):
        app.logger.error(f"Error 500: {str(error)}")
        return jsonify({
            "status": "error",
            "message": "Error interno del servidor"
        }), 500

    @app.errorhandler(405)
    def metodo_no_permitido(error):
        return jsonify({
            "status": "error",
            "message": "Método HTTP no permitido para este endpoint"
        }), 405


# ============================================================
# 16. FUNCIÓN PRINCIPAL Y EJECUCIÓN
# ============================================================

def mostrar_bienvenida():
    """Muestra un mensaje de bienvenida en la consola."""
    print("=" * 60)
    print("  PORTAFOLIO WEB - DOUGLAS ESTEBAN ESQUIVEL")
    print("=" * 60)
    print(f"  Empresa: {PERSONAL_INFO['empresa']}")
    print(f"  Email:   {PERSONAL_INFO['email']}")
    print(f"  Tel:     {PERSONAL_INFO['telefono_formateado']}")
    print("=" * 60)
    print(f"  Frase: {PERSONAL_INFO['frase_motivacional'][:50]}...")
    print("=" * 60)


def main():
    """Función principal de ejecución."""
    mostrar_bienvenida()

    # Crear carpeta de fotos si no existe
    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

    # Crear archivo README en la carpeta de fotos
    readme_path = UPLOAD_FOLDER / "LEEME.txt"
    if not readme_path.exists():
        readme_path.write_text(
            "CARPETA DE FOTOS - PORTAFOLIO DOUGLAS ESQUIVEL\n"
            "==============================================\n\n"
            "Instrucciones:\n"
            "1. Coloca tus fotos en esta carpeta.\n"
            "2. Nombra los archivos como: foto-1.jpg, foto-2.jpg, etc.\n"
            "3. Para la foto de perfil, nombra el archivo: perfil.jpg\n"
            "4. Formatos permitidos: JPG, PNG, GIF, WEBP, SVG\n"
            "5. Tamaño máximo recomendado: 2MB por foto\n\n"
            "Las fotos se cargarán automáticamente en la galería.\n",
            encoding='utf-8'
        )

    if not FLASK_AVAILABLE:
        print("\nFlask no está instalado. Modo de demostración de datos:")
        print("\nDatos personales cargados:")
        print(json.dumps(PERSONAL_INFO, indent=2, ensure_ascii=False)[:500])
        print("\nInstala Flask para ejecutar el servidor web completo.")
        return

    app = create_app()

    # Configuración del servidor
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'

    print(f"\nServidor iniciado en: http://{host}:{port}")
    print(f"API disponible en: http://{host}:{port}/api/health")
    print(f"Base de datos: {DATABASE_PATH}")
    print(f"Carpeta de fotos: {UPLOAD_FOLDER}")
    print("\nPresiona Ctrl+C para detener el servidor.\n")

    app.run(host=host, port=port, debug=debug)


if __name__ == '__main__':
    main()
