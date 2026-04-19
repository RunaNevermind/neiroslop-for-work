class AdaptiveCore {
    constructor() {
        this.overlay = this.#createOverlay();
        this.activePopup = null;
        this.scrollPosition = 0;
        
        this.#initPopups();
        this.#initSwiper();
    }

    // --- ПОПАПЫ И ОВЕРЛЕЙ ---
    #createOverlay() {
        const overlay = document.createElement('div');
        overlay.classList.add('core-overlay');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); z-index: 1000; display: none; opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => {
            // Закрываем только если кликнули именно по оверлею, а не по попапу
            if (e.target === overlay) this.closePopup();
        });
        return overlay;
    }

    #initPopups() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-popup-target]');
            const closeBtn = e.target.closest('.popup-close');
            
            if (target) {
                e.preventDefault();
                this.openPopup(target.dataset.popupTarget);
            }
            if (closeBtn) this.closePopup();
        });
    }

    openPopup(id) {
        const popup = document.getElementById(id);
        if (!popup) return;

        this.activePopup = popup;
        this.scrollPosition = window.pageYOffset;

        // Блокировка скролла
        const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.cssText = `
            overflow: hidden;
            padding-right: ${scrollBarWidth}px;
        `;

        this.overlay.style.display = 'block';
        setTimeout(() => this.overlay.style.opacity = '1', 10);
        
        popup.classList.add('is-active');
        popup.style.display = 'block';
    }

    closePopup() {
        if (!this.activePopup) return;

        this.overlay.style.opacity = '0';
        this.activePopup.classList.remove('is-active');
        this.activePopup.style.display = 'none';

        setTimeout(() => {
            this.overlay.style.display = 'none';
            document.body.style.cssText = '';
            window.scrollTo(0, this.scrollPosition);
        }, 300);

        this.activePopup = null;
    }

    // --- BREAKPOINTS ---
    /**
     * @param {string} query - Медиа-запрос, например "max-width: 768px" или "(min-width: 768px) and (max-width: 1024px)"
     * @param {Object} actions - match/unmatch функции
     */
    addBreakpoint(query, actions) {
        // Если передано просто число, превращаем в max-width
        const fullQuery = isNaN(query) ? query : `(max-width: ${query}px)`;
        const mql = window.matchMedia(fullQuery);

        const handler = (event) => {
            if (event.matches) {
                if (actions.match) actions.match(this.dom);
            } else {
                if (actions.unmatch) actions.unmatch(this.dom);
            }
        };

        mql.addEventListener('change', handler);
        handler(mql); // Разовый запуск при инициализации
    }

    // хелперы для манипуляций
    get dom() {
        return {
            move: (el, to) => {
                const node = document.querySelector(el);
                const target = document.querySelector(to);
                if (node && target) target.appendChild(node);
            },
            addClass: (sel, cls) => document.querySelector(sel)?.classList.add(cls),
            removeClass: (sel, cls) => document.querySelector(sel)?.classList.remove(cls),
            setAttr: (sel, attr, val) => document.querySelector(sel)?.setAttribute(attr, val)
        };
    }

    // --- СЛАЙДЕР ---
    #initSwiper() {
        // Если Swiper не подключен на странице, просто выходим без ошибок
        if (typeof Swiper === 'undefined') return;

        this.sliders = []; // Хранилище для всех созданных слайдеров

        document.querySelectorAll('[data-core-slider]').forEach(el => {
            // Читаем настройки из атрибута. Если их нет, используем пустой объект.
            let customSettings = {};
            try {
                if (el.dataset.coreSlider) {
                    customSettings = JSON.parse(el.dataset.coreSlider);
                }
            } catch (e) {
                console.error("Ошибка в JSON настройках слайдера:", e);
            }

            // Базовые настройки, которые можно переопределить
            const defaultSettings = {
                slidesPerView: 1,
                spaceBetween: 20,
                pagination: { el: el.querySelector('.swiper-pagination'), clickable: true },
                navigation: {
                    nextEl: el.querySelector('.swiper-button-next'),
                    prevEl: el.querySelector('.swiper-button-prev'),
                },
            };

            // Объединяем дефолты с тем, что пришло из HTML
            const finalSettings = { ...defaultSettings, ...customSettings };

            // Создаем слайдер и сохраняем его в массив
            const sliderInstance = new Swiper(el, finalSettings);
            this.sliders.push(sliderInstance);
        });
    }

}

class SVGManager {
    constructor() {
        this.gradients = new Map();
        this.masks = new Map();
        this.filters = new Map();
        this.defsElement = null;
        this.loadedSVGs = new Map(); // Хранилище загруженных SVG
        this.triggers = new Map(); // Хранилище триггеров
        this.animations = new Map(); // Хранилище анимаций
    }

    initInlineSVG(container) {
        const containerEl = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        if (!containerEl) throw new Error('Container not found');

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        
        this.defsElement = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(this.defsElement);
        
        containerEl.appendChild(svg);
        return svg;
    }

    createLinearGradient(id, stops, x1 = 0, y1 = 0, x2 = 1, y2 = 1) {
        if (!this.defsElement) {
            throw new Error('Call initInlineSVG first or use external SVG mode');
        }

        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', id);
        gradient.setAttribute('x1', x1);
        gradient.setAttribute('y1', y1);
        gradient.setAttribute('x2', x2);
        gradient.setAttribute('y2', y2);

        stops.forEach(stop => {
            const stopEl = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stopEl.setAttribute('offset', stop.offset);
            stopEl.setAttribute('stop-color', stop.color);
            if (stop.opacity) stopEl.setAttribute('stop-opacity', stop.opacity);
            gradient.appendChild(stopEl);
        });

        this.defsElement.appendChild(gradient);
        this.gradients.set(id, gradient);
        return gradient;
    }

    createRadialGradient(id, stops, cx = 0.5, cy = 0.5, r = 0.5) {
        if (!this.defsElement) throw new Error('Call initInlineSVG first');

        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        gradient.setAttribute('id', id);
        gradient.setAttribute('cx', cx);
        gradient.setAttribute('cy', cy);
        gradient.setAttribute('r', r);

        stops.forEach(stop => {
            const stopEl = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stopEl.setAttribute('offset', stop.offset);
            stopEl.setAttribute('stop-color', stop.color);
            if (stop.opacity) stopEl.setAttribute('stop-opacity', stop.opacity);
            gradient.appendChild(stopEl);
        });

        this.defsElement.appendChild(gradient);
        this.gradients.set(id, gradient);
        return gradient;
    }

    createMask(id, elements, options = {}) {
        if (!this.defsElement) throw new Error('Call initInlineSVG first');

        const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        mask.setAttribute('id', id);
        
        Object.entries(options).forEach(([key, value]) => {
            mask.setAttribute(key, value);
        });

        elements.forEach(el => mask.appendChild(el));
        this.defsElement.appendChild(mask);
        this.masks.set(id, mask);
        return mask;
    }

    /**
     * Создание маски из внешнего изображения
     */
      /**
     * Создание маски из внешнего изображения (ИСПРАВЛЕНАЯ ВЕРСИЯ)
     */
    async createMaskFromImage(id, imageUrl, options = {}) {
        // Создаем временный контейнер для defs если его нет
        let defsElement = this.defsElement;
        let tempSvg = null;
        
        if (!defsElement) {
            // Создаем временный SVG для хранения defs
            tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            tempSvg.style.display = 'none';
            document.body.appendChild(tempSvg);
            defsElement = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            tempSvg.appendChild(defsElement);
        }

        const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        mask.setAttribute('id', id);
        
        Object.entries(options).forEach(([key, value]) => {
            mask.setAttribute(key, value);
        });

        // Загружаем изображение
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttribute('href', imageUrl);
        image.setAttribute('width', '100%');
        image.setAttribute('height', '100%');
        image.setAttribute('preserveAspectRatio', 'none');
        
        // Ждем загрузки изображения
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
            mask.appendChild(image);
        });
        
        defsElement.appendChild(mask);
        this.masks.set(id, mask);
        
        // Если создали временный SVG, оставляем его для использования
        if (tempSvg && !this.defsElement) {
            this.defsElement = defsElement;
        }
        
        return mask;
    }



    async createMaskInSVG(svgElement, maskId, imageUrl) {
        // Получаем или создаем defs
        let defsElement = svgElement.querySelector('defs');
        if (!defsElement) {
            defsElement = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svgElement.insertBefore(defsElement, svgElement.firstChild);
        }
        
        const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        mask.setAttribute('id', maskId);
        
        // Создаем изображение для маски
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttribute('href', imageUrl);
        image.setAttribute('width', '100%');
        image.setAttribute('height', '100%');
        image.setAttribute('preserveAspectRatio', 'none');
        
        // Ждем загрузки изображения
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = () => {
                console.warn(`Could not load mask image: ${imageUrl}`);
                resolve(); // Продолжаем даже если изображение не загрузилось
            };
            mask.appendChild(image);
        });
        
        defsElement.appendChild(mask);
        this.masks.set(maskId, mask);
        
        return mask;
    }

    /**
     * Добавление градиента в defs
     */
    addGradientToDefs(defsElement, gradientId, gradientConfig) {
        const { type, stops, angle = 0 } = gradientConfig;
        
        let gradient;
        if (type === 'linear') {
            gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            const rad = (angle - 90) * Math.PI / 180;
            const x1 = Math.cos(rad) / 2 + 0.5;
            const y1 = Math.sin(rad) / 2 + 0.5;
            const x2 = 1 - x1;
            const y2 = 1 - y1;
            
            gradient.setAttribute('id', gradientId);
            gradient.setAttribute('x1', x1);
            gradient.setAttribute('y1', y1);
            gradient.setAttribute('x2', x2);
            gradient.setAttribute('y2', y2);
        } else if (type === 'radial') {
            gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
            gradient.setAttribute('id', gradientId);
            gradient.setAttribute('cx', '50%');
            gradient.setAttribute('cy', '50%');
            gradient.setAttribute('r', '50%');
        } else {
            throw new Error('Unsupported gradient type: ' + type);
        }
        
        stops.forEach(stop => {
            const stopEl = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stopEl.setAttribute('offset', stop.offset);
            stopEl.setAttribute('stop-color', stop.color);
            if (stop.opacity) stopEl.setAttribute('stop-opacity', stop.opacity);
            gradient.appendChild(stopEl);
        });
        
        defsElement.appendChild(gradient);
        return gradient;
    }

    /**
     * Добавление триггеров к SVG 
     */
    addTriggersToSVG(svgElement, triggers) {
        triggers.forEach(trigger => {
            const { event, selector, actions } = trigger;
            
            // Если селектор не указан, применяем к корневому SVG
            let targetElements;
            if (!selector) {
                targetElements = [svgElement];
            } else {
                targetElements = svgElement.querySelectorAll(selector);
            }
            
            if (targetElements.length === 0) {
                console.warn(`Element with selector "${selector}" not found in SVG, skipping trigger`);
                return;
            }
            
            targetElements.forEach(targetElement => {
                const handler = (e) => {
                    e.stopPropagation();
                    this.executeActions(targetElement, actions, svgElement);
                };
                
                targetElement.addEventListener(event, handler);
                targetElement.style.cursor = 'pointer'; // Добавляем курсор для кликабельных элементов
                
                // Сохраняем для возможности удаления
                if (!this.triggers.has(svgElement)) {
                    this.triggers.set(svgElement, []);
                }
                this.triggers.get(svgElement).push({ targetElement, event, handler });
            });
        });
    }
    applyMask(element, maskId) {
        element.setAttribute('mask', `url(#${maskId})`);
    }

    applyGradient(element, gradientId, property = 'fill') {
        element.setAttribute(property, `url(#${gradientId})`);
    }

        /**
     * ПРИМЕНЕНИЕ СЛОЖНОГО CSS ГРАДИЕНТА ЧЕРЕЗ МАСКУ
     */
    applyComplexStyle(container, svgElement, fullCss, options = {}) {
        const containerEl = typeof container === 'string' ? document.querySelector(container) : container;
        if (!containerEl || !svgElement) return;

        // Сериализуем текущее состояние SVG (учитывая замены цветов и т.д.)
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const encodedSVG = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

        // Применяем градиент к контейнеру, используя SVG как трафарет
        Object.assign(containerEl.style, {
            background: fullCss,
            webkitMaskImage: `url("${encodedSVG}")`,
            maskImage: `url("${encodedSVG}")`,
            webkitMaskSize: options.maskSize || 'contain',
            maskSize: options.maskSize || 'contain',
            webkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            webkitMaskPosition: 'center',
            maskPosition: 'center'
        });

        // Скрываем сам SVG элемент, так как он теперь работает только как маска для фона контейнера
        svgElement.style.opacity = '0';
    }

    /**
     * Загрузка SVG с поддержкой градиентов для fill и stroke
     */
    async loadSVGWithGradients(url, container, options = {}) {
        try {
            const response = await fetch(url);
            let svgText = await response.text();
            
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
            const svgElement = svgDoc.documentElement;
            
            const svgId = 'svg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            let defsElement = svgElement.querySelector('defs') || 
                svgElement.insertBefore(document.createElementNS('http://www.w3.org/2000/svg', 'defs'), svgElement.firstChild);
            
            if (options.fillGradient) {
                const id = `${svgId}_fill_grad`;
                this.addGradientToDefs(defsElement, id, options.fillGradient);
                this.applyGradientToElements(svgElement, id, 'fill');
            }
            
            if (options.strokeGradient) {
                const id = `${svgId}_stroke_grad`;
                this.addGradientToDefs(defsElement, id, options.strokeGradient);
                this.applyGradientToElements(svgElement, id, 'stroke');
            }
            
            if (options.colorReplacements) this.replaceColors(svgElement, options.colorReplacements);
            if (options.width) svgElement.setAttribute('width', options.width);
            if (options.height) svgElement.setAttribute('height', options.height);
            
            const containerEl = typeof container === 'string' ? document.querySelector(container) : container;
            if (options.clearContainer) containerEl.innerHTML = '';
            
            containerEl.appendChild(svgElement);

            // --- НОВАЯ ЛОГИКА ДЛЯ СЛОЖНЫХ ГРАДИЕНТОВ ---
            if (options.fullCss) {
                this.applyComplexStyle(containerEl, svgElement, options.fullCss, options);
            }
            // ------------------------------------------
            
            this.loadedSVGs.set(svgId, { element: svgElement, defs: defsElement, options });
            if (options.triggers) this.addTriggersToSVG(svgElement, options.triggers);
            
            return { svgElement, svgId };
        } catch (error) {
            console.error('Error loading SVG:', error);
            throw error;
        }
    }




    
    /**
     * Применение градиента ко всем элементам SVG
     */
    applyGradientToElements(svgElement, gradientId, property) {
        const elements = svgElement.querySelectorAll(`[${property}]`);
        elements.forEach(el => {
            const currentValue = el.getAttribute(property);
            if (currentValue && currentValue !== 'none') {
                el.setAttribute(property, `url(#${gradientId})`);
            }
        });
        
        // Также применяем к самому SVG если нужно
        if (svgElement.getAttribute(property)) {
            svgElement.setAttribute(property, `url(#${gradientId})`);
        }
    }
    
    
    /**
     * Выполнение действий при триггере
     */
    executeActions(element, actions, svgElement) {
        actions.forEach(action => {
            switch(action.type) {
                case 'changeColor':
                    this.changeColor(element, action.property, action.color);
                    break;
                case 'changeGradient':
                    this.changeGradient(element, action.property, action.gradientId);
                    break;
                case 'animate':
                    this.animateElement(element, action.animation);
                    break;
                case 'toggleClass':
                    element.classList.toggle(action.className);
                    break;
                case 'setAttribute':
                    element.setAttribute(action.attribute, action.value);
                    break;
                case 'scale':
                    this.scaleElement(element, action.scale);
                    break;
                case 'rotate':
                    this.rotateElement(element, action.degrees);
                    break;
                case 'fade':
                    this.fadeElement(element, action.opacity, action.duration);
                    break;
                case 'custom':
                    if (action.callback) action.callback(element, svgElement);
                    break;
            }
        });
    }
    
    /**
     * Изменение цвета элемента
     */
    changeColor(element, property, color) {
        element.setAttribute(property, color);
    }
    
    /**
     * Изменение градиента
     */
    changeGradient(element, property, gradientId) {
        element.setAttribute(property, `url(#${gradientId})`);
    }
    
    /**
     * Анимация элемента
     */
    animateElement(element, animationConfig) {
        const { property, from, to, duration = 300, easing = 'ease' } = animationConfig;
        
        const startTime = performance.now();
        const startValue = from !== undefined ? from : parseFloat(element.getAttribute(property) || 0);
        const endValue = to;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            let easedProgress;
            switch(easing) {
                case 'linear':
                    easedProgress = progress;
                    break;
                case 'ease-in':
                    easedProgress = progress * progress;
                    break;
                case 'ease-out':
                    easedProgress = 1 - (1 - progress) * (1 - progress);
                    break;
                default:
                    easedProgress = progress;
            }
            
            const currentValue = startValue + (endValue - startValue) * easedProgress;
            element.setAttribute(property, currentValue);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    /**
     * Масштабирование элемента
     */
    scaleElement(element, scale) {
        const currentTransform = element.getAttribute('transform') || '';
        const scaleTransform = `scale(${scale})`;
        
        if (currentTransform.includes('scale')) {
            element.setAttribute('transform', currentTransform.replace(/scale\([^)]*\)/, scaleTransform));
        } else {
            element.setAttribute('transform', `${currentTransform} ${scaleTransform}`.trim());
        }
    }
    
    /**
     * Вращение элемента
     */
    rotateElement(element, degrees) {
        const currentTransform = element.getAttribute('transform') || '';
        const rotateTransform = `rotate(${degrees})`;
        
        if (currentTransform.includes('rotate')) {
            element.setAttribute('transform', currentTransform.replace(/rotate\([^)]*\)/, rotateTransform));
        } else {
            element.setAttribute('transform', `${currentTransform} ${rotateTransform}`.trim());
        }
    }
    
    /**
     * Изменение прозрачности
     */
    fadeElement(element, opacity, duration = 300) {
        this.animateElement(element, {
            property: 'opacity',
            from: parseFloat(element.getAttribute('opacity') || 1),
            to: opacity,
            duration: duration
        });
    }
    
    /**
     * Удаление триггеров с SVG
     */
    removeTriggersFromSVG(svgElement) {
        const triggers = this.triggers.get(svgElement);
        if (triggers) {
            triggers.forEach(({ targetElement, event, handler }) => {
                targetElement.removeEventListener(event, handler);
            });
            this.triggers.delete(svgElement);
        }
    }

    replaceColors(svg, colorMap) {
        const elementsWithFill = svg.querySelectorAll('[fill]');
        const elementsWithStroke = svg.querySelectorAll('[stroke]');
        
        elementsWithFill.forEach(el => {
            const fill = el.getAttribute('fill');
            if (colorMap[fill]) {
                el.setAttribute('fill', colorMap[fill]);
            }
        });
        
        elementsWithStroke.forEach(el => {
            const stroke = el.getAttribute('stroke');
            if (colorMap[stroke]) {
                el.setAttribute('stroke', colorMap[stroke]);
            }
        });
    }

    applyAsBackground(element, svgContent, options = {}) {
        const el = typeof element === 'string' 
            ? document.querySelector(element) 
            : element;
        
        if (!el) {
            console.error('Element not found:', element);
            throw new Error(`Element not found: ${element}`);
        }
        
        let svgString = '';
        
        try {
            if (typeof svgContent === 'object') {
                if (svgContent.type === 'linear' || svgContent.type === 'radial') {
                    svgString = this.generateGradientSVG(svgContent);
                } else if (svgContent.type === 'gradient') {
                    svgString = this.generateGradientSVG(svgContent.gradient || svgContent);
                } else {
                    throw new Error('Invalid SVG content: object must have type "linear" or "radial"');
                }
            } else if (typeof svgContent === 'string') {
                svgString = svgContent;
            } else {
                throw new Error('Invalid SVG content: must be string or object');
            }
            
            const encodedSVG = this.encodeSVGForCSS(svgString);
            
            const backgroundStyle = {
                backgroundImage: `url("${encodedSVG}")`,
                backgroundRepeat: options.repeat || 'no-repeat',
                backgroundPosition: options.position || 'center',
                backgroundSize: options.size || 'cover'
            };
            
            Object.assign(el.style, backgroundStyle);
            
            console.log('Background applied successfully to:', element);
        } catch (error) {
            console.error('Error applying background:', error);
            throw error;
        }
    }

    applyAsBorder(element, svgContent, options = {}) {
        const el = typeof element === 'string' 
            ? document.querySelector(element) 
            : element;
        
        if (!el) {
            console.error('Element not found:', element);
            throw new Error(`Element not found: ${element}`);
        }
        
        try {
            const oldBorder = el.querySelector('.svg-border-container');
            if (oldBorder) {
                oldBorder.remove();
                console.log('Removed old border');
            }
            
            const borderContainer = document.createElement('div');
            borderContainer.className = 'svg-border-container';
            borderContainer.style.position = 'absolute';
            borderContainer.style.top = '0';
            borderContainer.style.left = '0';
            borderContainer.style.width = '100%';
            borderContainer.style.height = '100%';
            borderContainer.style.pointerEvents = 'none';
            borderContainer.style.zIndex = '1';
            
            let svgElement;
            
            if (typeof svgContent === 'string') {
                svgElement = this.createSVGFromString(svgContent);
            } 
            else if (typeof svgContent === 'object') {
                if (svgContent.type === 'linear' || svgContent.type === 'radial') {
                    svgElement = this.createBorderGradientSVG(svgContent, options);
                }
                else if (svgContent.type === 'gradient') {
                    svgElement = this.createBorderGradientSVG(svgContent.gradient || svgContent, options);
                }
                else {
                    throw new Error('Invalid border content: object must have type "linear" or "radial"');
                }
            }
            else {
                throw new Error('Invalid border content');
            }
            
            if (svgElement) {
                borderContainer.appendChild(svgElement);
                
                const originalPosition = window.getComputedStyle(el).position;
                if (originalPosition === 'static') {
                    el.style.position = 'relative';
                }
                
                el.appendChild(borderContainer);
                console.log('Border applied successfully to:', element);
            } else {
                throw new Error('Failed to create SVG element for border');
            }
        } catch (error) {
            console.error('Error applying border:', error);
            throw error;
        }
    }

    generateGradientSVG(gradientConfig) {
        const type = gradientConfig.type || 'linear';
        const stops = gradientConfig.stops || [];
        const angle = gradientConfig.angle || 0;
        
        if (stops.length === 0) {
            throw new Error('Gradient must have at least one stop');
        }
        
        let gradientDef = '';
        if (type === 'linear') {
            const rad = (angle - 90) * Math.PI / 180;
            const x1 = Math.cos(rad) / 2 + 0.5;
            const y1 = Math.sin(rad) / 2 + 0.5;
            const x2 = 1 - x1;
            const y2 = 1 - y1;
            
            gradientDef = `<linearGradient id="g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">`;
            stops.forEach(stop => {
                gradientDef += `<stop offset="${stop.offset}" stop-color="${stop.color}" stop-opacity="${stop.opacity || 1}"/>`;
            });
            gradientDef += `</linearGradient>`;
        } 
        else if (type === 'radial') {
            gradientDef = `<radialGradient id="g" cx="50%" cy="50%" r="50%">`;
            stops.forEach(stop => {
                gradientDef += `<stop offset="${stop.offset}" stop-color="${stop.color}" stop-opacity="${stop.opacity || 1}"/>`;
            });
            gradientDef += `</radialGradient>`;
        }
        else {
            throw new Error('Unsupported gradient type: ' + type);
        }
        
        return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <defs>${gradientDef}</defs>
            <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>`;
    }

    encodeSVGForCSS(svgString) {
        const cleaned = svgString.replace(/\s+/g, ' ').trim();
        return 'data:image/svg+xml,' + encodeURIComponent(cleaned);
    }

    createSVGFromString(svgString) {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;
        
        svgElement.setAttribute('width', '100%');
        svgElement.setAttribute('height', '100%');
        
        return svgElement;
    }

    createBorderGradientSVG(gradientConfig, borderOptions = {}) {
        const type = gradientConfig.type || 'linear';
        const stops = gradientConfig.stops || [];
        const angle = gradientConfig.angle || 0;
        const { strokeWidth = 2, cornerRadius = 0 } = borderOptions;
        
        if (stops.length === 0) {
            throw new Error('Gradient must have at least one stop');
        }
        
        let gradientDef = '';
        if (type === 'linear') {
            const rad = (angle - 90) * Math.PI / 180;
            const x1 = Math.cos(rad) / 2 + 0.5;
            const y1 = Math.sin(rad) / 2 + 0.5;
            const x2 = 1 - x1;
            const y2 = 1 - y1;
            
            gradientDef = `<linearGradient id="borderGrad" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">`;
            stops.forEach(stop => {
                gradientDef += `<stop offset="${stop.offset}" stop-color="${stop.color}" stop-opacity="${stop.opacity || 1}"/>`;
            });
            gradientDef += `</linearGradient>`;
        } 
        else if (type === 'radial') {
            gradientDef = `<radialGradient id="borderGrad" cx="50%" cy="50%" r="50%">`;
            stops.forEach(stop => {
                gradientDef += `<stop offset="${stop.offset}" stop-color="${stop.color}" stop-opacity="${stop.opacity || 1}"/>`;
            });
            gradientDef += `</radialGradient>`;
        }
        
        const rx = cornerRadius > 0 ? `rx="${cornerRadius}"` : '';
        const ry = cornerRadius > 0 ? `ry="${cornerRadius}"` : '';
        
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <defs>${gradientDef}</defs>
            <rect width="100%" height="100%" fill="none" stroke="url(#borderGrad)" stroke-width="${strokeWidth}" ${rx} ${ry}/>
        </svg>`;
        
        console.log('Generated border SVG:', svgString);
        return this.createSVGFromString(svgString);
    }

    destroy() {
        this.gradients.clear();
        this.masks.clear();
        this.filters.clear();
        this.loadedSVGs.clear();
        
        // Очищаем триггеры
        this.triggers.forEach((triggers, svgElement) => {
            this.removeTriggersFromSVG(svgElement);
        });
        
        if (this.defsElement) {
            this.defsElement.innerHTML = '';
        }
    }
}