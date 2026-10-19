/* ============================================================
   ARCHIVO: script.js
   PROYECTO: Biografía Douglas Esteban Esquivel
   DESCRIPCIÓN: JavaScript completo - Interactividad y animaciones
   VERSIÓN: 1.0.0
   AUTOR: Douglas Esteban Esquivel
   ============================================================ */

/* ============================================================
   TABLA DE CONTENIDO:
   1.  IIFE wrapper y configuración
   2.  Utilidades y helpers
   3.  Preloader
   4.  Navegación y menú móvil
   5.  Tema oscuro/claro
   6.  Efecto de scroll en header
   7.  Navegación activa por sección
   8.  Efecto typing (texto animado)
   9.  Contadores animados
   10. Barras de habilidades animadas
   11. Animaciones de scroll reveal
   12. Filtro de proyectos
   13. Galería y lightbox
   14. Formulario de contacto
   15. Sistema de toast notifications
   16. Botón volver arriba
   17. Partículas de fondo
   18. Efecto parallax
   19. Smooth scroll
   20. Año automático en footer
   21. Carga de imágenes de galería
   22. Inicialización y manejo de eventos
   ============================================================ */

(function () {
    'use strict';

    /* ============================================================
       1. CONFIGURACIÓN GLOBAL
       ============================================================ */
    var CONFIG = {
        typedStrings: [
            'Desarrollador de Software',
            'Especialista en Bases de Datos',
            'Programador Full-Stack',
            'Creador de Soluciones Digitales',
            'Aprendiz Continuo'
        ],
        typedSpeed: 80,
        typedDeleteSpeed: 40,
        typedPause: 2000,
        counterDuration: 2000,
        skillAnimationDelay: 200,
        toastDuration: 4000,
        galleryImages: [
            'fotos/foto-1.jpg',
            'fotos/foto-2.jpg',
            'fotos/foto-3.jpg',
            'fotos/foto-4.jpg',
            'fotos/foto-5.jpg',
            'fotos/foto-6.jpg'
        ]
    };

    /* ============================================================
       2. UTILIDADES Y HELPERS
       ============================================================ */

    /**
     * Selecciona un elemento del DOM por selector
     * @param {string} selector - Selector CSS
     * @param {Element} context - Contexto de búsqueda (opcional)
     * @returns {Element|null}
     */
    function $(selector, context) {
        return (context || document).querySelector(selector);
    }

    /**
     * Selecciona múltiples elementos del DOM
     * @param {string} selector - Selector CSS
     * @param {Element} context - Contexto de búsqueda (opcional)
     * @returns {NodeList}
     */
    function $$(selector, context) {
        return (context || document).querySelectorAll(selector);
    }

    /**
     * Añade un event listener con soporte para múltiples elementos
     * @param {Element|NodeList|Array} elements - Elemento(s)
     * @param {string} event - Nombre del evento
     * @param {Function} handler - Función manejadora
     */
    function on(elements, event, handler) {
        if (elements instanceof NodeList || Array.isArray(elements)) {
            elements.forEach(function (el) {
                if (el) el.addEventListener(event, handler);
            });
        } else if (elements) {
            elements.addEventListener(event, handler);
        }
    }

    /**
     * Debounce function para optimizar eventos de scroll/resize
     * @param {Function} func - Función a debouncear
     * @param {number} wait - Tiempo de espera en ms
     * @returns {Function}
     */
    function debounce(func, wait) {
        var timeout;
        return function () {
            var context = this;
            var args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                func.apply(context, args);
            }, wait);
        };
    }

    /**
     * Throttle function para limitar ejecuciones
     * @param {Function} func - Función a throttlear
     * @param {number} limit - Límite de tiempo en ms
     * @returns {Function}
     */
    function throttle(func, limit) {
        var inThrottle;
        return function () {
            var context = this;
            var args = arguments;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(function () {
                    inThrottle = false;
                }, limit);
            }
        };
    }

    /**
     * Interpola entre dos valores
     * @param {number} start - Valor inicial
     * @param {number} end - Valor final
     * @param {number} progress - Progreso (0 a 1)
     * @returns {number}
     */
    function lerp(start, end, progress) {
        return start + (end - start) * progress;
    }

    /**
     * Función de easing easeOutCubic
     * @param {number} t - Tiempo (0 a 1)
     * @returns {number}
     */
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * Función de easing easeInOutQuad
     * @param {number} t - Tiempo (0 a 1)
     * @returns {number}
     */
    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    /**
     * Valida un email con regex
     * @param {string} email - Email a validar
     * @returns {boolean}
     */
    function isValidEmail(email) {
        var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /**
     * Escapa HTML para prevenir XSS
     * @param {string} text - Texto a escapar
     * @returns {string}
     */
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /* ============================================================
       3. PRELOADER
       ============================================================ */
    var Preloader = {
        element: null,
        progressBar: null,
        progress: 0,

        init: function () {
            this.element = $('#preloader');
            this.progressBar = $('#preloaderProgress');
            if (!this.element) return;

            this.simulateProgress();
            window.addEventListener('load', this.complete.bind(this));

            // Fallback: si tarda mucho, ocultar de todos modos
            setTimeout(this.complete.bind(this), 5000);
        },

        simulateProgress: function () {
            var self = this;
            var interval = setInterval(function () {
                if (self.progress < 90) {
                    self.progress += Math.random() * 15;
                    if (self.progress > 90) self.progress = 90;
                    self.updateBar();
                } else {
                    clearInterval(interval);
                }
            }, 200);
        },

        updateBar: function () {
            if (this.progressBar) {
                this.progressBar.style.width = this.progress + '%';
            }
        },

        complete: function () {
            if (!this.element || this.element.classList.contains('hidden')) return;

            this.progress = 100;
            this.updateBar();

            var self = this;
            setTimeout(function () {
                self.element.classList.add('hidden');
                setTimeout(function () {
                    if (self.element && self.element.parentNode) {
                        self.element.parentNode.removeChild(self.element);
                    }
                }, 600);
            }, 300);
        }
    };

    /* ============================================================
       4. NAVEGACIÓN Y MENÚ MÓVIL
       ============================================================ */
    var Navigation = {
        header: null,
        navToggle: null,
        navMenu: null,
        navLinks: null,

        init: function () {
            this.header = $('#header');
            this.navToggle = $('#navToggle');
            this.navMenu = $('#navMenu');
            this.navLinks = $$('.nav-link');

            this.bindEvents();
        },

        bindEvents: function () {
            var self = this;

            // Toggle menú móvil
            on(this.navToggle, 'click', function () {
                self.toggleMenu();
            });

            // Cerrar menú al hacer clic en un enlace
            on(this.navLinks, 'click', function () {
                self.closeMenu();
            });

            // Cerrar menú al hacer clic fuera
            on(document, 'click', function (e) {
                if (self.navMenu && self.navMenu.classList.contains('active')) {
                    if (!self.navMenu.contains(e.target) && !self.navToggle.contains(e.target)) {
                        self.closeMenu();
                    }
                }
            });

            // Cerrar menú con tecla Escape
            on(document, 'keydown', function (e) {
                if (e.key === 'Escape' && self.navMenu && self.navMenu.classList.contains('active')) {
                    self.closeMenu();
                }
            });
        },

        toggleMenu: function () {
            if (!this.navToggle || !this.navMenu) return;
            this.navToggle.classList.toggle('active');
            this.navMenu.classList.toggle('active');
            document.body.style.overflow = this.navMenu.classList.contains('active') ? 'hidden' : '';
        },

        closeMenu: function () {
            if (!this.navToggle || !this.navMenu) return;
            this.navToggle.classList.remove('active');
            this.navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    /* ============================================================
       5. TEMA OSCURO / CLARO
       ============================================================ */
    var ThemeManager = {
        toggleBtn: null,
        currentTheme: 'dark',
        storageKey: 'douglas-theme',

        init: function () {
            this.toggleBtn = $('#themeToggle');
            this.loadTheme();
            this.bindEvents();
        },

        loadTheme: function () {
            try {
                var saved = localStorage.getItem(this.storageKey);
                if (saved) {
                    this.currentTheme = saved;
                } else {
                    // Detectar preferencia del sistema
                    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                        this.currentTheme = 'light';
                    }
                }
            } catch (e) {
                // localStorage no disponible
            }
            this.applyTheme();
        },

        applyTheme: function () {
            if (this.currentTheme === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
            this.updateIcon();
        },

        updateIcon: function () {
            if (!this.toggleBtn) return;
            var icon = this.toggleBtn.querySelector('i');
            if (!icon) return;

            if (this.currentTheme === 'light') {
                icon.className = 'ri-sun-line';
            } else {
                icon.className = 'ri-moon-line';
            }
        },

        toggle: function () {
            this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.applyTheme();
            this.saveTheme();

            Toast.show(
                this.currentTheme === 'light' ? 'Tema claro activado' : 'Tema oscuro activado',
                'info'
            );
        },

        saveTheme: function () {
            try {
                localStorage.setItem(this.storageKey, this.currentTheme);
            } catch (e) {
                // Ignorar errores de almacenamiento
            }
        },

        bindEvents: function () {
            var self = this;
            on(this.toggleBtn, 'click', function () {
                self.toggle();
            });
        }
    };

    /* ============================================================
       6. EFECTO DE SCROLL EN HEADER
       ============================================================ */
    var HeaderScroll = {
        header: null,
        backToTop: null,

        init: function () {
            this.header = $('#header');
            this.backToTop = $('#backToTop');
            this.bindEvents();
            this.onScroll(); // Estado inicial
        },

        onScroll: function () {
            var scrollY = window.pageYOffset || document.documentElement.scrollTop;

            // Header con fondo al hacer scroll
            if (this.header) {
                if (scrollY > 50) {
                    this.header.classList.add('scrolled');
                } else {
                    this.header.classList.remove('scrolled');
                }
            }

            // Botón volver arriba
            if (this.backToTop) {
                if (scrollY > 500) {
                    this.backToTop.classList.add('visible');
                } else {
                    this.backToTop.classList.remove('visible');
                }
            }
        },

        bindEvents: function () {
            var self = this;
            window.addEventListener('scroll', throttle(function () {
                self.onScroll();
            }, 100));
        }
    };

    /* ============================================================
       7. NAVEGACIÓN ACTIVA POR SECCIÓN (ScrollSpy)
       ============================================================ */
    var ScrollSpy = {
        sections: [],
        navLinks: [],

        init: function () {
            this.sections = $$('section[id]');
            this.navLinks = $$('.nav-link');
            this.bindEvents();
        },

        onScroll: function () {
            var scrollY = window.pageYOffset + 100;
            var currentId = '';

            this.sections.forEach(function (section) {
                var sectionTop = section.offsetTop;
                var sectionHeight = section.offsetHeight;
                if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                    currentId = section.getAttribute('id');
                }
            });

            this.navLinks.forEach(function (link) {
                link.classList.remove('active');
                var href = link.getAttribute('href');
                if (href === '#' + currentId) {
                    link.classList.add('active');
                }
            });
        },

        bindEvents: function () {
            var self = this;
            window.addEventListener('scroll', throttle(function () {
                self.onScroll();
            }, 150));
        }
    };

    /* ============================================================
       8. EFECTO TYPING (TEXTO ANIMADO)
       ============================================================ */
    var TypedEffect = {
        element: null,
        strings: [],
        stringIndex: 0,
        charIndex: 0,
        isDeleting: false,
        isPaused: false,

        init: function () {
            this.element = $('#typedText');
            if (!this.element) return;

            this.strings = CONFIG.typedStrings;
            this.type();
        },

        type: function () {
            var self = this;
            var currentString = this.strings[this.stringIndex];

            if (this.isDeleting) {
                this.charIndex--;
            } else {
                this.charIndex++;
            }

            this.element.textContent = currentString.substring(0, this.charIndex);

            var delay = this.isDeleting ? CONFIG.typedDeleteSpeed : CONFIG.typedSpeed;

            if (!this.isDeleting && this.charIndex === currentString.length) {
                // Pausa al terminar de escribir
                delay = CONFIG.typedPause;
                this.isDeleting = true;
            } else if (this.isDeleting && this.charIndex === 0) {
                // Pasar a la siguiente frase
                this.isDeleting = false;
                this.stringIndex = (this.stringIndex + 1) % this.strings.length;
                delay = 500;
            }

            setTimeout(function () {
                self.type();
            }, delay);
        }
    };

    /* ============================================================
       9. CONTADORES ANIMADOS
       ============================================================ */
    var CounterAnimation = {
        counters: [],
        hasAnimated: false,

        init: function () {
            this.counters = $$('.stat-number');
            if (this.counters.length === 0) return;

            this.observe();
        },

        observe: function () {
            var self = this;

            if ('IntersectionObserver' in window) {
                var observer = new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting && !self.hasAnimated) {
                            self.animateAll();
                            self.hasAnimated = true;
                            observer.disconnect();
                        }
                    });
                }, { threshold: 0.5 });

                var heroStats = $('.hero-stats');
                if (heroStats) observer.observe(heroStats);
            } else {
                // Fallback para navegadores sin IntersectionObserver
                setTimeout(function () {
                    self.animateAll();
                }, 1000);
            }
        },

        animateAll: function () {
            this.counters.forEach(function (counter) {
                var target = parseInt(counter.getAttribute('data-target'), 10) || 0;
                CounterAnimation.animateOne(counter, target);
            });
        },

        animateOne: function (element, target) {
            var startTime = null;
            var duration = CONFIG.counterDuration;

            function update(timestamp) {
                if (!startTime) startTime = timestamp;
                var progress = Math.min((timestamp - startTime) / duration, 1);
                var eased = easeOutCubic(progress);
                var current = Math.floor(eased * target);

                element.textContent = current;

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    element.textContent = target;
                }
            }

            requestAnimationFrame(update);
        }
    };

    /* ============================================================
       10. BARRAS DE HABILIDADES ANIMADAS
       ============================================================ */
    var SkillBars = {
        bars: [],
        hasAnimated: false,

        init: function () {
            this.bars = $$('.skill-progress');
            if (this.bars.length === 0) return;

            this.observe();
        },

        observe: function () {
            var self = this;

            if ('IntersectionObserver' in window) {
                var observer = new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting && !self.hasAnimated) {
                            self.animateAll();
                            self.hasAnimated = true;
                            observer.disconnect();
                        }
                    });
                }, { threshold: 0.3 });

                var skillsSection = $('#habilidades');
                if (skillsSection) observer.observe(skillsSection);
            } else {
                setTimeout(function () {
                    self.animateAll();
                }, 1500);
            }
        },

        animateAll: function () {
            this.bars.forEach(function (bar, index) {
                var width = bar.getAttribute('data-width') || 0;
                setTimeout(function () {
                    bar.style.width = width + '%';
                }, index * CONFIG.skillAnimationDelay);
            });
        }
    };

    /* ============================================================
       11. ANIMACIONES DE SCROLL REVEAL
       ============================================================ */
    var ScrollReveal = {
        elements: [],

        init: function () {
            // Añadir clases de reveal a elementos clave
            this.addRevealClasses();
            this.elements = $$('.reveal, .reveal-left, .reveal-right');

            if (this.elements.length === 0) return;
            this.observe();
        },

        addRevealClasses: function () {
            // Aplicar reveal a tarjetas de proyectos
            var projectCards = $$('.project-card');
            projectCards.forEach(function (card, i) {
                card.classList.add('reveal');
                card.style.transitionDelay = (i * 0.1) + 's';
            });

            // Aplicar reveal a tarjetas de servicios
            var serviceCards = $$('.service-card');
            serviceCards.forEach(function (card, i) {
                card.classList.add('reveal');
                card.style.transitionDelay = (i * 0.1) + 's';
            });

            // Aplicar reveal a items de timeline
            var timelineItems = $$('.timeline-item');
            timelineItems.forEach(function (item, i) {
                item.classList.add(i % 2 === 0 ? 'reveal-left' : 'reveal-right');
            });

            // Aplicar reveal a categorías de skills
            var skillCategories = $$('.skill-category');
            skillCategories.forEach(function (cat, i) {
                cat.classList.add('reveal');
                cat.style.transitionDelay = (i * 0.15) + 's';
            });

            // Aplicar reveal a items de galería
            var galleryItems = $$('.gallery-item');
            galleryItems.forEach(function (item, i) {
                item.classList.add('reveal');
                item.style.transitionDelay = (i * 0.08) + 's';
            });

            // Aplicar reveal a info items
            var infoItems = $$('.info-item');
            infoItems.forEach(function (item, i) {
                item.classList.add('reveal');
                item.style.transitionDelay = (i * 0.05) + 's';
            });
        },

        observe: function () {
            var self = this;

            if ('IntersectionObserver' in window) {
                var observer = new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                            observer.unobserve(entry.target);
                        }
                    });
                }, {
                    threshold: 0.1,
                    rootMargin: '0px 0px -50px 0px'
                });

                this.elements.forEach(function (el) {
                    observer.observe(el);
                });
            } else {
                // Fallback: mostrar todo
                this.elements.forEach(function (el) {
                    el.classList.add('visible');
                });
            }
        }
    };

    /* ============================================================
       12. FILTRO DE PROYECTOS
       ============================================================ */
    var ProjectFilter = {
        filterBtns: [],
        projectCards: [],

        init: function () {
            this.filterBtns = $$('.filter-btn');
            this.projectCards = $$('.project-card');

            if (this.filterBtns.length === 0) return;
            this.bindEvents();
        },

        bindEvents: function () {
            var self = this;

            on(this.filterBtns, 'click', function (e) {
                var btn = e.currentTarget;
                var filter = btn.getAttribute('data-filter');

                // Actualizar botón activo
                self.filterBtns.forEach(function (b) {
                    b.classList.remove('active');
                });
                btn.classList.add('active');

                // Filtrar proyectos
                self.filterProjects(filter);
            });
        },

        filterProjects: function (filter) {
            this.projectCards.forEach(function (card) {
                var category = card.getAttribute('data-category');
                var shouldShow = filter === 'todos' || category === filter;

                if (shouldShow) {
                    card.classList.remove('hidden');
                    // Re-animar entrada
                    card.style.animation = 'none';
                    card.offsetHeight; // Trigger reflow
                    card.style.animation = 'slideUp 0.5s ease forwards';
                } else {
                    card.classList.add('hidden');
                }
            });
        }
    };

    /* ============================================================
       13. GALERÍA Y LIGHTBOX
       ============================================================ */
    var Gallery = {
        items: [],
        lightbox: null,
        lightboxImage: null,
        lightboxCounter: null,
        currentIndex: 0,
        images: [],

        init: function () {
            this.items = $$('.gallery-item');
            this.lightbox = $('#lightbox');
            this.lightboxImage = $('#lightboxImage');
            this.lightboxCounter = $('#lightboxCounter');

            if (this.items.length === 0) return;

            this.loadImages();
            this.bindEvents();
        },

        loadImages: function () {
            // Intentar cargar imágenes reales de la carpeta /fotos
            var self = this;
            this.items.forEach(function (item, index) {
                var imgSrc = CONFIG.galleryImages[index];
                if (!imgSrc) return;

                var img = new Image();
                img.onload = function () {
                    // Si la imagen existe, reemplazar el placeholder
                    var placeholder = item.querySelector('.gallery-placeholder');
                    if (placeholder) {
                        item.innerHTML = '<img src="' + imgSrc + '" alt="Foto ' + (index + 1) + '" loading="lazy">';
                        item.style.background = '#000';
                    }
                    self.images[index] = imgSrc;
                };
                img.onerror = function () {
                    // La imagen no existe, mantener placeholder
                    self.images[index] = null;
                };
                img.src = imgSrc;
            });
        },

        bindEvents: function () {
            var self = this;

            // Abrir lightbox al hacer clic en una imagen
            on(this.items, 'click', function (e) {
                var item = e.currentTarget;
                var index = parseInt(item.getAttribute('data-index'), 10) - 1;
                self.open(index);
            });

            // Cerrar lightbox
            on($('#lightboxClose'), 'click', function () {
                self.close();
            });

            // Navegación
            on($('#lightboxPrev'), 'click', function () {
                self.prev();
            });

            on($('#lightboxNext'), 'click', function () {
                self.next();
            });

            // Cerrar al hacer clic fuera de la imagen
            if (this.lightbox) {
                on(this.lightbox, 'click', function (e) {
                    if (e.target === self.lightbox) {
                        self.close();
                    }
                });
            }

            // Navegación con teclado
            on(document, 'keydown', function (e) {
                if (!self.lightbox || !self.lightbox.classList.contains('active')) return;

                if (e.key === 'Escape') self.close();
                if (e.key === 'ArrowLeft') self.prev();
                if (e.key === 'ArrowRight') self.next();
            });
        },

        open: function (index) {
            if (!this.lightbox) return;

            this.currentIndex = index;
            this.updateLightbox();
            this.lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        },

        close: function () {
            if (!this.lightbox) return;
            this.lightbox.classList.remove('active');
            document.body.style.overflow = '';
        },

        prev: function () {
            this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
            this.updateLightbox();
        },

        next: function () {
            this.currentIndex = (this.currentIndex + 1) % this.items.length;
            this.updateLightbox();
        },

        updateLightbox: function () {
            if (!this.lightboxImage || !this.lightboxCounter) return;

            var imgSrc = this.images[this.currentIndex];
            if (imgSrc) {
                this.lightboxImage.src = imgSrc;
                this.lightboxImage.style.display = 'block';
            } else {
                this.lightboxImage.style.display = 'none';
            }

            this.lightboxCounter.textContent = (this.currentIndex + 1) + ' / ' + this.items.length;
        }
    };

    /* ============================================================
       14. FORMULARIO DE CONTACTO
       ============================================================ */
    var ContactForm = {
        form: null,
        submitBtn: null,
        successMsg: null,
        fields: {},

        init: function () {
            this.form = $('#contactForm');
            if (!this.form) return;

            this.submitBtn = $('#submitBtn');
            this.successMsg = $('#formSuccess');

            this.fields = {
                nombre: {
                    input: $('#nombre'),
                    error: $('#nombreError'),
                    validate: function (val) {
                        return val.trim().length >= 2;
                    },
                    errorMsg: 'Por favor ingresa tu nombre (mínimo 2 caracteres).'
                },
                email: {
                    input: $('#email'),
                    error: $('#emailError'),
                    validate: function (val) {
                        return isValidEmail(val.trim());
                    },
                    errorMsg: 'Por favor ingresa un email válido.'
                },
                asunto: {
                    input: $('#asunto'),
                    error: $('#asuntoError'),
                    validate: function (val) {
                        return val.trim().length >= 3;
                    },
                    errorMsg: 'Por favor ingresa un asunto (mínimo 3 caracteres).'
                },
                mensaje: {
                    input: $('#mensaje'),
                    error: $('#mensajeError'),
                    validate: function (val) {
                        return val.trim().length >= 10;
                    },
                    errorMsg: 'Por favor escribe un mensaje (mínimo 10 caracteres).'
                }
            };

            this.bindEvents();
        },

        bindEvents: function () {
            var self = this;

            // Validación en tiempo real al perder el foco
            Object.keys(this.fields).forEach(function (key) {
                var field = self.fields[key];
                if (field.input) {
                    on(field.input, 'blur', function () {
                        self.validateField(key);
                    });
                    on(field.input, 'input', function () {
                        self.clearError(key);
                    });
                }
            });

            // Envío del formulario
            on(this.form, 'submit', function (e) {
                e.preventDefault();
                self.handleSubmit();
            });
        },

        validateField: function (key) {
            var field = this.fields[key];
            if (!field || !field.input) return true;

            var value = field.input.value;
            var isValid = field.validate(value);

            var formGroup = field.input.closest('.form-group');

            if (!isValid) {
                if (formGroup) formGroup.classList.add('error');
                if (field.error) field.error.textContent = field.errorMsg;
                return false;
            } else {
                this.clearError(key);
                return true;
            }
        },

        clearError: function (key) {
            var field = this.fields[key];
            if (!field) return;

            var formGroup = field.input ? field.input.closest('.form-group') : null;
            if (formGroup) formGroup.classList.remove('error');
            if (field.error) field.error.textContent = '';
        },

        validateAll: function () {
            var self = this;
            var allValid = true;

            Object.keys(this.fields).forEach(function (key) {
                if (!self.validateField(key)) {
                    allValid = false;
                }
            });

            return allValid;
        },

        handleSubmit: function () {
            var self = this;

            if (!this.validateAll()) {
                Toast.show('Por favor corrige los errores en el formulario.', 'error');
                return;
            }

            // Simular envío
            if (this.submitBtn) {
                this.submitBtn.classList.add('loading');
                this.submitBtn.disabled = true;
            }

            // Simular delay de red
            setTimeout(function () {
                // Mostrar éxito
                if (self.successMsg) {
                    self.successMsg.classList.add('show');
                }

                if (self.submitBtn) {
                    self.submitBtn.classList.remove('loading');
                    self.submitBtn.disabled = false;
                }

                // Resetear formulario
                self.form.reset();

                Toast.show('¡Mensaje enviado con éxito! Te responderé pronto.', 'success');

                // Ocultar mensaje de éxito después de un tiempo
                setTimeout(function () {
                    if (self.successMsg) {
                        self.successMsg.classList.remove('show');
                    }
                }, 5000);
            }, 1500);
        }
    };

    /* ============================================================
       15. SISTEMA DE TOAST NOTIFICATIONS
       ============================================================ */
    var Toast = {
        container: null,

        init: function () {
            this.container = $('#toastContainer');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'toastContainer';
                this.container.className = 'toast-container';
                document.body.appendChild(this.container);
            }
        },

        show: function (message, type) {
            type = type || 'info';

            var toast = document.createElement('div');
            toast.className = 'toast ' + type;

            var iconClass = 'ri-information-line';
            if (type === 'success') iconClass = 'ri-checkbox-circle-fill';
            if (type === 'error') iconClass = 'ri-error-warning-fill';

            toast.innerHTML =
                '<i class="toast-icon ' + iconClass + '"></i>' +
                '<p class="toast-message">' + escapeHtml(message) + '</p>';

            this.container.appendChild(toast);

            var self = this;
            setTimeout(function () {
                toast.classList.add('hide');
                setTimeout(function () {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 400);
            }, CONFIG.toastDuration);
        }
    };

    /* ============================================================
       16. BOTÓN VOLVER ARRIBA
       ============================================================ */
    var BackToTop = {
        button: null,

        init: function () {
            this.button = $('#backToTop');
            if (!this.button) return;

            var self = this;
            on(this.button, 'click', function () {
                self.scrollToTop();
            });
        },

        scrollToTop: function () {
            var startPosition = window.pageYOffset;
            var startTime = null;
            var duration = 800;

            function animation(currentTime) {
                if (!startTime) startTime = currentTime;
                var timeElapsed = currentTime - startTime;
                var progress = Math.min(timeElapsed / duration, 1);
                var eased = easeInOutQuad(progress);

                window.scrollTo(0, startPosition * (1 - eased));

                if (progress < 1) {
                    requestAnimationFrame(animation);
                }
            }

            requestAnimationFrame(animation);
        }
    };

    /* ============================================================
       17. PARTÍCULAS DE FONDO (Canvas)
       ============================================================ */
    var Particles = {
        canvas: null,
        ctx: null,
        particles: [],
        animationId: null,
        mouseX: 0,
        mouseY: 0,

        init: function () {
            // Crear canvas solo en escritorio
            if (window.innerWidth < 768) return;

            this.canvas = document.createElement('canvas');
            this.canvas.className = 'particles-canvas';
            this.canvas.style.cssText =
                'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.3;';

            var hero = $('.hero');
            if (hero) {
                hero.appendChild(this.canvas);
            } else {
                document.body.appendChild(this.canvas);
            }

            this.ctx = this.canvas.getContext('2d');
            this.resize();
            this.createParticles();
            this.bindEvents();
            this.animate();
        },

        resize: function () {
            if (!this.canvas) return;
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        },

        createParticles: function () {
            var count = Math.min(Math.floor(window.innerWidth / 15), 60);
            this.particles = [];

            for (var i = 0; i < count; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    radius: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.5 + 0.2
                });
            }
        },

        bindEvents: function () {
            var self = this;

            window.addEventListener('resize', debounce(function () {
                self.resize();
                self.createParticles();
            }, 250));

            window.addEventListener('mousemove', throttle(function (e) {
                self.mouseX = e.clientX;
                self.mouseY = e.clientY;
            }, 50));
        },

        animate: function () {
            var self = this;
            if (!this.ctx) return;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            var isLight = document.documentElement.getAttribute('data-theme') === 'light';
            var particleColor = isLight ? '0, 0, 0' : '255, 255, 255';

            // Actualizar y dibujar partículas
            this.particles.forEach(function (p) {
                p.x += p.vx;
                p.y += p.vy;

                // Rebotar en bordes
                if (p.x < 0 || p.x > self.canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > self.canvas.height) p.vy *= -1;

                // Interacción con mouse
                var dx = p.x - self.mouseX;
                var dy = p.y - self.mouseY;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    var force = (100 - dist) / 100;
                    p.x += (dx / dist) * force * 2;
                    p.y += (dy / dist) * force * 2;
                }

                self.ctx.beginPath();
                self.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                self.ctx.fillStyle = 'rgba(' + particleColor + ', ' + p.opacity + ')';
                self.ctx.fill();
            });

            // Dibujar conexiones
            for (var i = 0; i < this.particles.length; i++) {
                for (var j = i + 1; j < this.particles.length; j++) {
                    var p1 = this.particles[i];
                    var p2 = this.particles[j];
                    var dx = p1.x - p2.x;
                    var dy = p1.y - p2.y;
                    var dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 120) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(p1.x, p1.y);
                        this.ctx.lineTo(p2.x, p2.y);
                        this.ctx.strokeStyle = 'rgba(' + particleColor + ', ' + (0.15 * (1 - dist / 120)) + ')';
                        this.ctx.lineWidth = 0.5;
                        this.ctx.stroke();
                    }
                }
            }

            this.animationId = requestAnimationFrame(function () {
                self.animate();
            });
        },

        destroy: function () {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
        }
    };

    /* ============================================================
       18. EFECTO PARALLAX
       ============================================================ */
    var Parallax = {
        elements: [],

        init: function () {
            this.elements = $$('.hero-glow, .about-experience-badge');
            if (this.elements.length === 0) return;

            this.bindEvents();
        },

        onScroll: function () {
            var scrollY = window.pageYOffset;

            $$('.hero-glow').forEach(function (el, i) {
                var speed = (i + 1) * 0.15;
                el.style.transform = 'translateY(' + (scrollY * speed) + 'px)';
            });
        },

        bindEvents: function () {
            var self = this;
            window.addEventListener('scroll', throttle(function () {
                self.onScroll();
            }, 50));
        }
    };

    /* ============================================================
       19. SMOOTH SCROLL PARA ENLACES ANCLA
       ============================================================ */
    var SmoothScroll = {
        init: function () {
            var links = $$('a[href^="#"]');
            var self = this;

            on(links, 'click', function (e) {
                var href = this.getAttribute('href');
                if (href === '#' || href.length < 2) return;

                var target = $(href);
                if (!target) return;

                e.preventDefault();
                self.scrollTo(target);
            });
        },

        scrollTo: function (element) {
            var headerHeight = 70;
            var targetPosition = element.offsetTop - headerHeight;
            var startPosition = window.pageYOffset;
            var distance = targetPosition - startPosition;
            var startTime = null;
            var duration = Math.min(Math.abs(distance) * 0.5, 1000);

            function animation(currentTime) {
                if (!startTime) startTime = currentTime;
                var timeElapsed = currentTime - startTime;
                var progress = Math.min(timeElapsed / duration, 1);
                var eased = easeInOutQuad(progress);

                window.scrollTo(0, startPosition + distance * eased);

                if (progress < 1) {
                    requestAnimationFrame(animation);
                }
            }

            requestAnimationFrame(animation);
        }
    };

    /* ============================================================
       20. AÑO AUTOMÁTICO EN FOOTER
       ============================================================ */
    function setCurrentYear() {
        var yearEl = $('#currentYear');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }
    }

    /* ============================================================
       21. CARGA DE IMAGEN DE PERFIL
       ============================================================ */
    var ProfileImage = {
        init: function () {
            // Intentar cargar foto de perfil desde /fotos/perfil.jpg
            var img = new Image();
            img.onload = function () {
                var placeholders = $$('.hero-image-placeholder, .about-image-placeholder');
                placeholders.forEach(function (ph) {
                    if (ph) {
                        var parent = ph.parentNode;
                        if (parent) {
                            parent.innerHTML = '<img src="fotos/perfil.jpg" alt="Douglas Esteban Esquivel" style="width:100%;height:100%;object-fit:cover;">';
                        }
                    }
                });
            };
            img.src = 'fotos/perfil.jpg';
        }
    };

    /* ============================================================
       22. TARJETAS DE PROYECTO - EFECTO 3D TILT
       ============================================================ */
    var TiltEffect = {
        cards: [],

        init: function () {
            // Solo en escritorio
            if (window.innerWidth < 1024) return;

            this.cards = $$('.project-card, .service-card');
            var self = this;

            on(this.cards, 'mousemove', function (e) {
                self.handleTilt(e, this);
            });

            on(this.cards, 'mouseleave', function () {
                this.style.transform = '';
                this.style.transition = 'transform 0.5s ease';
            });
        },

        handleTilt: function (e, card) {
            var rect = card.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var centerX = rect.width / 2;
            var centerY = rect.height / 2;
            var rotateX = (y - centerY) / centerY * -5;
            var rotateY = (x - centerX) / centerX * 5;

            card.style.transition = 'transform 0.1s ease';
            card.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-8px)';
        }
    };

    /* ============================================================
       23. ANIMACIÓN DE ENTRADA DE HERO
       ============================================================ */
    var HeroAnimation = {
        init: function () {
            // Las animaciones de hero se manejan con CSS
            // Aquí añadimos delays progresivos a elementos
            var elements = [
                '.hero-badge',
                '.hero-title',
                '.hero-typed',
                '.hero-description',
                '.hero-buttons',
                '.hero-social'
            ];

            elements.forEach(function (selector, i) {
                var el = $(selector);
                if (el) {
                    el.style.opacity = '0';
                    el.style.transform = 'translateY(20px)';
                    el.style.transition = 'opacity 0.8s ease ' + (0.8 + i * 0.15) + 's, transform 0.8s ease ' + (0.8 + i * 0.15) + 's';

                    setTimeout(function () {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                    }, 100);
                }
            });
        }
    };

    /* ============================================================
       24. VALIDACIÓN DE ENLACES EXTERNOS
       ============================================================ */
    var LinkValidator = {
        init: function () {
            // Asegurar que todos los enlaces externos tengan target="_blank" y rel="noopener"
            var links = $$('a[href^="http"]');
            links.forEach(function (link) {
                if (!link.getAttribute('target')) {
                    link.setAttribute('target', '_blank');
                }
                if (!link.getAttribute('rel')) {
                    link.setAttribute('rel', 'noopener');
                }
            });
        }
    };

    /* ============================================================
       25. INICIALIZACIÓN PRINCIPAL
       ============================================================ */
    function init() {
        // Inicializar módulos en orden
        Preloader.init();
        Toast.init();
        Navigation.init();
        ThemeManager.init();
        HeaderScroll.init();
        ScrollSpy.init();
        TypedEffect.init();
        CounterAnimation.init();
        SkillBars.init();
        ScrollReveal.init();
        ProjectFilter.init();
        Gallery.init();
        ContactForm.init();
        BackToTop.init();
        SmoothScroll.init();
        Parallax.init();
        ProfileImage.init();
        TiltEffect.init();
        HeroAnimation.init();
        LinkValidator.init();
        setCurrentYear();

        // Iniciar partículas después de un pequeño delay para no bloquear
        setTimeout(function () {
            Particles.init();
        }, 2000);

        // Bienvenida en consola (detalle para desarrolladores)
        console.log('%c Douglas Esteban Esquivel ', 'background: #fff; color: #000; font-size: 20px; font-weight: bold; padding: 10px;');
        console.log('%c Desarrollador de Software | Bases de Datos ', 'color: #888; font-size: 12px;');
        console.log('%c "Aprende, estudia, crea - todos tenemos un propósito" ', 'color: #aaa; font-style: italic;');

        // Toast de bienvenida
        setTimeout(function () {
            Toast.show('¡Bienvenido a mi portafolio!', 'info');
        }, 1500);
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Exponer algunos módulos para debugging (opcional)
    window.DouglasPortfolio = {
        Toast: Toast,
        ThemeManager: ThemeManager,
        Particles: Particles,
        version: '1.0.0'
    };

})();
