# Portafolio Web - Douglas Esteban Esquivel

Sitio web de biografía y portafolio profesional, con diseño monocromático elegante.

## Estructura del Proyecto

```
biografia-douglas/
├── index.html      # Página principal (HTML puro)
├── style.css       # Hoja de estilos (CSS completo)
├── script.js       # Interactividad (JavaScript)
├── app.py          # Servidor Python Flask con API REST
├── fotos/          # Carpeta para tus fotos
│   └── LEEME.txt   # Instrucciones para agregar fotos
└── README.md       # Este archivo
```

## Cómo Usar

### Opción 1: Abrir directamente (sin servidor)
Simplemente abre `index.html` en tu navegador. La página funcionará
con todas sus animaciones e interacciones.

### Opción 2: Usar el servidor Python (recomendado)
```bash
# Instalar dependencias
pip install flask flask-cors

# Ejecutar el servidor
python app.py
```
Luego abre `http://localhost:5000` en tu navegador.

### Opción 3: Subir a GitHub Pages
1. Crea un repositorio en GitHub
2. Sube todos estos archivos
3. Activa GitHub Pages en Settings → Pages
4. Tu sitio estará en: `https://tu-usuario.github.io/tu-repo/`

## Agregar tus Fotos
1. Coloca `perfil.jpg` en la carpeta `fotos/` para tu foto de perfil
2. Coloca `foto-1.jpg` hasta `foto-6.jpg` para la galería
3. Consulta `fotos/LEEME.txt` para más detalles

## Características
- Diseño monocromático profesional (negro/blanco/gris)
- Tema oscuro y claro (toggle)
- Animaciones de scroll y reveal
- Efecto typing en el hero
- Contadores animados
- Barras de habilidades animadas
- Filtro de proyectos por categoría
- Galería con lightbox
- Formulario de contacto con validación
- Partículas de fondo interactivas
- Totalmente responsive (móvil, tablet, escritorio)
- API REST completa en Python (Flask)
- Base de datos SQLite integrada

## Datos Incluidos
- Video de YouTube
- Canal de YouTube
- Instagram
- Facebook
- LinkedIn
- Email: duglaspro7@gmail.com
- Teléfono: 3987 5180
- Edad: 19 años
- Empresa: D'ouglas Company
- Frase motivacional personalizada

---
"Aprende, estudia, crea — todos tenemos un propósito."
