/* ================================================================
   PCCELL — script.js
   Lógica principal del ecommerce:
   - Catálogo de productos.
   - Carrito de compras (con localStorage).
   - Buscador en tiempo real.
   - Drawer del carrito.
   - Modal de instalación PWA.
   - Envío de pedido por WhatsApp.
   - Botón "Volver arriba".
   - Toast / notificaciones.
   - Menú móvil.
   - Registro del Service Worker.
   ================================================================ */

(function () {
    'use strict';

    /* ============================================================
       CONFIGURACIÓN GLOBAL
       ============================================================ */
    const CONFIG = {
        whatsappNumber: '5492314417643', // Número para pedidos (sin + ni espacios)
        whatsappDisplay: '+54 9 2314 41-7643',
        currency: '$',                    // Símbolo de moneda
        storageCart: 'shopnow_cart',     // Clave localStorage del carrito
        storageInstall: 'shopnow_install_dismissed' // Clave del modal cerrado
    };

    /* ============================================================
       CATÁLOGO DE PRODUCTOS
       Se pueden agregar/quitar/modificar fácilmente desde aquí.
       ============================================================ */
    const PRODUCTS = [
        {
            id: 1,
            name: 'Auriculares Noga Stormer',
            description: 'Llevá tu experiencia gamer al siguiente nivel con un sonido potente, comodidad extrema y un diseño único.',
            price: 25000,
            image: 'https://tiendapccell.github.io/pccell/img/stromer.png'
        },
        {
            id: 2,
            name: 'Aspiradora Kärcher VC1',
            description: 'Combina funcionalidad y eficiencia para limpiar suelos y alfombras sin esfuerzo. Permite el acceso a huecos estrechos, esquinas y bordes.',
            price: 220000,
            image: 'img/vc1.png'
        },
        {
            id: 3,
            name: 'Cámara Digital 4K',
            description: 'Captura fotos y videos profesionales con resolución 4K y estabilización óptica.',
            price: 349999,
            image: 'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=600&q=80'
        },
        {
            id: 4,
            name: 'Mochila Antirrobo',
            description: 'Diseño moderno con compartimento para laptop 15", carga USB y material impermeable.',
            price: 45999,
            image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'
        },
        {
            id: 5,
            name: 'Lámpara LED Escritorio',
            description: '3 tonos de luz, 5 niveles de brillo, brazo articulado y puerto de carga USB.',
            price: 28999,
            image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80'
        },
        {
            id: 6,
            name: 'Set de Sartenes Antiadherente',
            description: 'Juego de 3 sartenes con revestimiento cerámico libre de PFOA, aptas para inducción.',
            price: 67999,
            image: 'https://images.unsplash.com/photo-1584990347449-a8d7c05a7335?auto=format&fit=crop&w=600&q=80'
        },
        {
            id: 7,
            name: 'Altavoz Portátil Bluetooth',
            description: 'Sonido 360° con graves potentes, resistente al agua IPX7 y 24h de reproducción.',
            price: 54999,
            image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80'
        },
        {
            id: 8,
            name: 'Zapatillas Running Ultra',
            description: 'Ultra ligeras con espuma reactiva, malla transpirable y excelente amortiguación.',
            price: 89999,
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'
        },
        {
            id: 9,
            name: 'Cargador Portátil 20000mAh',
            description: 'Carga rápida PD 20W, 3 salidas simultáneas, indicador LED y diseño compacto.',
            price: 39999,
            image: 'https://images.unsplash.com/photo-1609592424823-40c55c0ae6ed?auto=format&fit=crop&w=600&q=80'
        },
        {
            id: 10,
            name: 'Teclado Mecánico RGB',
            description: 'Switches mecánicos rojos, iluminación RGB personalizable y reposamuñecas ergonómico.',
            price: 95999,
            image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80'
        },
        {
            id: 11,
            name: 'Vaso Térmico Acero Inox',
            description: 'Mantiene frío 24h y calor 12h. Capacidad 500ml, libre de BPA, a prueba de derrames.',
            price: 24999,
            image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80'
        },
        {
            id: 12,
            name: 'Kit Iluminación Studio',
            description: '2 softboxes de 50x70cm con bombillas LED regulables y trípodes ajustables.',
            price: 189999,
            image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80'
        },
        {
            id: 13,
            name: 'Mouse Gaming Inalámbrico',
            description: 'Sensor óptico 16.000 DPI, 8 botones programables, RGB y hasta 70h de batería.',
            price: 74999,
            image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80'
        },
        {
            id: 14,
            name: 'Hucha Digital Inteligente',
            description: 'Cuenta automáticamente monedas, muestra el total en pantalla LCD y cierre con PIN.',
            price: 32999,
            image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80'
        }
    ];

    /* ============================================================
       ESTADO GLOBAL
       ============================================================ */
    let cart = loadCart();              // Productos en el carrito
    let deferredPrompt = null;          // Evento beforeinstallprompt
    let searchTerm = '';                 // Término de búsqueda actual

    /* ============================================================
       UTILIDADES
       ============================================================ */

    /** Carga el carrito desde localStorage (o devuelve array vacío) */
    function loadCart() {
        try {
            const raw = localStorage.getItem(CONFIG.storageCart);
            return raw ? JSON.parse(raw) : [];
        } catch (err) {
            console.warn('No se pudo leer el carrito:', err);
            return [];
        }
    }

    /** Guarda el carrito en localStorage */
    function saveCart() {
        try {
            localStorage.setItem(CONFIG.storageCart, JSON.stringify(cart));
        } catch (err) {
            console.warn('No se pudo guardar el carrito:', err);
        }
    }

    /** Formatea un número como precio (separador de miles) */
    function formatPrice(value) {
        return CONFIG.currency + Number(value).toLocaleString('es-AR');
    }

    /** Obtiene la cantidad total de ítems en el carrito */
    function getCartCount() {
        return cart.reduce((sum, item) => sum + item.qty, 0);
    }

    /** Obtiene el importe total del carrito */
    function getCartTotal() {
        return cart.reduce((sum, item) => sum + item.qty * item.price, 0);
    }

    /* ============================================================
       RENDER: CATÁLOGO DE PRODUCTOS
       ============================================================ */
    const productsGrid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');
    const resultsCount = document.getElementById('resultsCount');

    /** Renderiza los productos filtrados por el buscador */
    function renderProducts() {
        const term = searchTerm.trim().toLowerCase();

        // Filtrar por nombre o descripción
        const filtered = PRODUCTS.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term)
        );

        resultsCount.textContent = filtered.length;
        productsGrid.innerHTML = '';

        if (filtered.length === 0) {
            emptyState.hidden = false;
            return;
        }

        emptyState.hidden = true;

        // Construir cada tarjeta
        filtered.forEach((product, idx) => {
            const card = document.createElement('article');
            card.className = 'product-card';
            card.style.animationDelay = (idx * 40) + 'ms';

            card.innerHTML = `
                <div class="product-card__image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-card__body">
                    <h3 class="product-card__name">${product.name}</h3>
                    <p class="product-card__desc">${product.description}</p>
                    <div class="product-card__price">${product.price.toLocaleString('es-AR')}</div>
                    <button class="product-card__btn" data-id="${product.id}">
                        <i class="fa-solid fa-cart-plus"></i> Agregar al carrito
                    </button>
                </div>
            `;

            // Escuchar clic del botón agregar
            card.querySelector('.product-card__btn')
                .addEventListener('click', () => addToCart(product.id));

            productsGrid.appendChild(card);
        });
    }

    /* ============================================================
       CARRITO DE COMPRAS
       ============================================================ */
    const btnCart = document.getElementById('btnCart');
    const cartDrawer = document.getElementById('cartDrawer');
    const cartOverlay = document.getElementById('cartOverlay');
    const btnCloseCart = document.getElementById('btnCloseCart');
    const cartBody = document.getElementById('cartBody');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartFooter = document.getElementById('cartFooter');
    const cartBadge = document.getElementById('cartBadge');
    const cartQtyEl = document.getElementById('cartQty');
    const cartTotalEl = document.getElementById('cartTotal');
    const btnClearCart = document.getElementById('btnClearCart');
    const btnWhatsapp = document.getElementById('btnWhatsapp');

    /** Agrega un producto al carrito (o incrementa su cantidad) */
    function addToCart(productId) {
        const product = PRODUCTS.find(p => p.id === productId);
        if (!product) return;

        const existing = cart.find(item => item.id === productId);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                qty: 1
            });
        }

        saveCart();
        renderCart();
        showToast(`${product.name} agregado`);

        // Pequeña animación en el icono del carrito
        btnCart.animate(
            [
                { transform: 'scale(1)' },
                { transform: 'scale(1.15)' },
                { transform: 'scale(1)' }
            ],
            { duration: 350, easing: 'ease-out' }
        );
    }

    /** Decrementa la cantidad de un producto en el carrito */
    function decrementItem(productId) {
        const item = cart.find(i => i.id === productId);
        if (!item) return;
        item.qty -= 1;
        if (item.qty <= 0) {
            removeItem(productId);
            return;
        }
        saveCart();
        renderCart();
    }

    /** Incrementa la cantidad de un producto */
    function incrementItem(productId) {
        const item = cart.find(i => i.id === productId);
        if (!item) return;
        item.qty += 1;
        saveCart();
        renderCart();
    }

    /** Elimina completamente un producto del carrito */
    function removeItem(productId) {
        cart = cart.filter(i => i.id !== productId);
        saveCart();
        renderCart();
    }

    /** Vacía el carrito */
    function clearCart() {
        if (cart.length === 0) return;
        if (!confirm('¿Estás seguro/a de vaciar el carrito?')) return;
        cart = [];
        saveCart();
        renderCart();
        showToast('Carrito vaciado');
    }

    /** Renderiza el contenido del drawer del carrito */
    function renderCart() {
        // Badge (cantidad total)
        const totalQty = getCartCount();
        cartBadge.textContent = totalQty;
        cartBadge.classList.toggle('badge--show', totalQty > 0);

        // Totales
        cartQtyEl.textContent = totalQty;
        cartTotalEl.textContent = formatPrice(getCartTotal());

        // Cuerpo
        cartBody.innerHTML = '';
        if (cart.length === 0) {
            cartEmpty.hidden = false;
            cartBody.hidden = true;
            cartFooter.style.display = 'none';
            return;
        }

        cartEmpty.hidden = true;
        cartBody.hidden = false;
        cartFooter.style.display = 'flex';

        cart.forEach(item => {
            const row = document.createElement('div');
            row.className = 'cart-item';
            const subtotal = item.qty * item.price;

            row.innerHTML = `
                <div class="cart-item__img">
                    <img src="${item.image}" alt="${item.name}" loading="lazy">
                </div>
                <div class="cart-item__info">
                    <div class="cart-item__name">${item.name}</div>
                    <div class="cart-item__prices">
                        ${formatPrice(item.price)} c/u · Subtotal: <strong>${formatPrice(subtotal)}</strong>
                    </div>
                    <div class="cart-item__controls">
                        <button class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Disminuir">−</button>
                        <span class="qty-value">${item.qty}</span>
                        <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Aumentar">+</button>
                        <button class="btn-remove" data-action="del" data-id="${item.id}" aria-label="Eliminar">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;

            // Eventos de control
            row.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    const id = Number(btn.dataset.id);
                    if (action === 'inc') incrementItem(id);
                    else if (action === 'dec') decrementItem(id);
                    else if (action === 'del') removeItem(id);
                });
            });

            cartBody.appendChild(row);
        });
    }

    /** Abre el drawer del carrito */
    function openCart() {
        cartDrawer.classList.add('cart-drawer--open');
        cartOverlay.classList.add('overlay--show');
        cartDrawer.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    /** Cierra el drawer del carrito */
    function closeCart() {
        cartDrawer.classList.remove('cart-drawer--open');
        cartOverlay.classList.remove('overlay--show');
        cartDrawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    /* ============================================================
       PEDIDO POR WHATSAPP
       ============================================================ */

    /** Construye el mensaje del pedido y abre WhatsApp */
    function sendOrderByWhatsApp() {
        if (cart.length === 0) {
            showToast('Tu carrito está vacío', 'warn');
            return;
        }

        // Construir líneas del pedido
        const lines = cart.map(item => {
            const subtotal = item.qty * item.price;
            return `${item.name} x${item.qty} = ${formatPrice(subtotal)}`;
        });

        const total = getCartTotal();

        // Mensaje final
        const message =
`Hola, quisiera realizar el siguiente pedido:

🛒 Pedido:

${lines.join('\n')}

Total del pedido: ${formatPrice(total)}

Por favor confirmar disponibilidad de stock.

Entiendo que el pedido será revisado y que recibiré una respuesta por WhatsApp con la confirmación correspondiente.

Muchas gracias.`;

        // Construir URL correctamente codificada
        const url = 'https://wa.me/' + CONFIG.whatsappNumber + '?text=' +
                    encodeURIComponent(message);

        // Abrir en nueva pestaña
        window.open(url, '_blank', 'noopener');
    }

    /* ============================================================
       BUSCADOR EN TIEMPO REAL
       ============================================================ */
    const searchInput = document.getElementById('searchInput');
    let searchTimer = null;

    function setupSearch() {
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value;
            // Debounce simple para no re-renderizar en cada pulsación
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                searchTerm = value;
                renderProducts();
            }, 150);
        });
    }

    /* ============================================================
       TOAST / NOTIFICACIÓN
       ============================================================ */
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    let toastTimer = null;

    function showToast(message, type = 'success') {
        toastMsg.textContent = message;
        const icon = toast.querySelector('i');
        icon.className = type === 'warn'
            ? 'fa-solid fa-circle-exclamation'
            : 'fa-solid fa-circle-check';
        icon.style.color = type === 'warn' ? '#f59e0b' : '#4ade80';

        toast.classList.add('toast--show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('toast--show'), 2500);
    }

    /* ============================================================
       MENÚ MÓVIL
       ============================================================ */
    const btnMenu = document.getElementById('btnMenu');
    const mobileMenu = document.getElementById('mobileMenu');

    function setupMobileMenu() {
        btnMenu.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('mobile-menu--open');
            mobileMenu.setAttribute('aria-hidden', String(!isOpen));
            const icon = btnMenu.querySelector('i');
            icon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
        });

        // Cerrar menú al pulsar un enlace
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('mobile-menu--open');
                mobileMenu.setAttribute('aria-hidden', 'true');
                btnMenu.querySelector('i').className = 'fa-solid fa-bars';
            });
        });
    }

    /* ============================================================
       BOTÓN VOLVER ARRIBA
       ============================================================ */
    const btnBackToTop = document.getElementById('btnBackToTop');

    function setupBackToTop() {
        window.addEventListener('scroll', () => {
            btnBackToTop.classList.toggle('back-to-top--show', window.scrollY > 500);
        }, { passive: true });

        btnBackToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ============================================================
       MODAL DE INSTALACIÓN PWA
       - Usa beforeinstallprompt.
       - No se muestra si el usuario lo cerró (localStorage).
       - Si se instala, queda deshabilitado permanentemente.
       ============================================================ */
    const installModal = document.getElementById('installModal');
    const btnInstall = document.getElementById('btnInstall');
    const btnCloseInstall = document.getElementById('btnCloseInstall');

    function setupInstallModal() {
        // Si ya cerró el modal, no mostrar
        if (localStorage.getItem(CONFIG.storageInstall) === 'dismissed') return;
        if (localStorage.getItem(CONFIG.storageInstall) === 'installed') return;

        // Capturar evento de instalabilidad
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            showInstallModal();
        });

        // Si la app se instala, registrarlo
        window.addEventListener('appinstalled', () => {
            localStorage.setItem(CONFIG.storageInstall, 'installed');
            hideInstallModal();
            deferredPrompt = null;
            showToast('¡Aplicación instalada!');
        });

        // Botón Instalar
        btnInstall.addEventListener('click', async () => {
            if (!deferredPrompt) {
                // Si no hay prompt automático (navegador no lo soporta),
                // guiar al usuario: mostrar toast informativo.
                showToast('Usa "Agregar a pantalla" en tu navegador', 'warn');
                return;
            }
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                localStorage.setItem(CONFIG.storageInstall, 'installed');
            }
            deferredPrompt = null;
            hideInstallModal();
        });

        // Botón Cerrar
        btnCloseInstall.addEventListener('click', () => {
            localStorage.setItem(CONFIG.storageInstall, 'dismissed');
            hideInstallModal();
        });

        // Clic en el fondo cierra el modal
        installModal.addEventListener('click', (e) => {
            if (e.target === installModal) {
                localStorage.setItem(CONFIG.storageInstall, 'dismissed');
                hideInstallModal();
            }
        });

        // Mostrar el modal al cabo de unos segundos también
        // (como respaldo en navegadores que no lanzan beforeinstallprompt)
        setTimeout(() => {
            if (!localStorage.getItem(CONFIG.storageInstall)) {
                showInstallModal();
            }
        }, 5000);
    }

    function showInstallModal() {
        installModal.classList.add('modal-install--show');
        installModal.setAttribute('aria-hidden', 'false');
    }

    function hideInstallModal() {
        installModal.classList.remove('modal-install--show');
        installModal.setAttribute('aria-hidden', 'true');
    }

    /* ============================================================
       SERVICE WORKER
       ============================================================ */
    function setupServiceWorker() {
        if (!('serviceWorker' in navigator)) return;

        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
                .then(reg => console.log('SW registrado:', reg.scope))
                .catch(err => console.warn('SW falló:', err));
        });
    }

    /* ============================================================
       OTROS
       ============================================================ */
    function setupMisc() {
        // Año dinámico en el footer
        const yearEl = document.getElementById('year');
        if (yearEl) yearEl.textContent = new Date().getFullYear();

        // Eventos del carrito
        btnCart.addEventListener('click', openCart);
        btnCloseCart.addEventListener('click', closeCart);
        cartOverlay.addEventListener('click', closeCart);
        btnClearCart.addEventListener('click', clearCart);
        btnWhatsapp.addEventListener('click', sendOrderByWhatsApp);

        // Cerrar carrito con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && cartDrawer.classList.contains('cart-drawer--open')) {
                closeCart();
            }
        });

        // Cerrar menú móvil al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!mobileMenu.contains(e.target) && !btnMenu.contains(e.target)) {
                mobileMenu.classList.remove('mobile-menu--open');
                mobileMenu.setAttribute('aria-hidden', 'true');
                btnMenu.querySelector('i').className = 'fa-solid fa-bars';
            }
        });
    }

    /* ============================================================
       INICIALIZACIÓN
       ============================================================ */
    function init() {
        renderProducts();
        renderCart();
        setupSearch();
        setupMobileMenu();
        setupBackToTop();
        setupInstallModal();
        setupServiceWorker();
        setupMisc();
        console.log('%cShopNow listo 🛒', 'color:#2563eb;font-weight:bold;font-size:14px;');
    }

    // Esperar que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
