

const core = new AdaptiveCore(); // подключение адаптива

// 1. Адаптив (Планшет)
core.addBreakpoint("(min-width: 768px) and (max-width: 1024px)", {
    match: (dom) => { // match и unmatch здесь вместо if/else
        dom.move("#user-panel", "#tablet-target"); 
        dom.addClass("#user-panel", "is-highlighted");
    },
    unmatch: (dom) => {
        dom.move("#user-panel", ".header-tools"); // Не забудь вернуть на место, что бы не перезагружаться какждый раз при проверке
        dom.removeClass("#user-panel", "is-highlighted");
    },
});

// 2. Адаптив (Мобилка)
core.addBreakpoint(767, { // Это обозначение ОТ 767 пикселей
    match: (dom) => {
        dom.move("#user-panel", "#mobile-target");
    },
    unmatch: (dom) => {
        if (window.innerWidth > 1024) {
            dom.move("#user-panel", ".header-tools");
        }
    },
});



const svgManager = new SVGManager(); // работа с свг, не смогла придумать, что еще добавить.
const logInfo = document.getElementById('logInfo');

function addLog(message, isError = false) {
    const logEntry = document.createElement('div');
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logEntry.style.color = isError ? 'red' : 'green';
    logInfo.appendChild(logEntry);
    logInfo.scrollTop = logInfo.scrollHeight;
    console.log(message);
}

// ========== 1. SVG с разными градиентами для fill и stroke ==========
async function loadSVGWithDifferentGradients() {
    const container = document.querySelector('#gradientSvgContainer');
    
    // 1. Берем путь из data-src
    const svgPath = container ? container.dataset.src : null;

    if (!svgPath) {
        addLog('✗ Путь к SVG не найден в HTML-атрибутах', true);
        return null;
    }

    try {
        addLog(`Загрузка SVG из: ${svgPath}...`);

        const result = await svgManager.loadSVGWithGradients(svgPath, '#gradientSvgContainer', {
            fillGradient: {
                type: 'linear',
                angle: 45,
                stops: [
                    { offset: '0%', color: '#ff6b6b' },
                    { offset: '100%', color: '#45b7d1' }
                ]
            },
            strokeGradient: {
                type: 'linear',
                angle: 135,
                stops: [
                    { offset: '0%', color: '#f093fb' },
                    { offset: '100%', color: '#f5576c' }
                ]
            },
            width: '100%',
            height: '100%',
            clearContainer: true
        });

        addLog('✓ SVG успешно загружен из HTML-ссылки');
        return result;
    } catch (error) {
        addLog(`✗ Ошибка: ${error.message}`, true);
        createDemoSVG('#gradientSvgContainer', 'linear');
        return null;
    }
}

// ========== 2. SVG с маской из PNG ==========
async function loadSVGWithMask() {
    const container = document.querySelector('#maskedSvgContainer');
    
    // 1. Берем путь из data-src
    const svgPath = container ? container.dataset.src : null;

    const maskImage = container ? container.dataset.mask : null;
    try {
        addLog('Загрузка SVG с маской...');

        const result = await svgManager.loadSVGWithGradients(svgPath, container, {
            maskImage: maskImage,
            fillGradient: {
                type: 'radial',
                stops: [
                    { offset: '0%', color: '#667eea' },
                    { offset: '100%', color: '#764ba2' }
                ]
            },
            width: '100%',
            height: '100%',
            clearContainer: true
        });

        addLog('✓ SVG с маской успешно загружен');
        return result;
    } catch (error) {
        addLog(`✗ Ошибка загрузки SVG с маской: ${error.message}`, true);
        createDemoSVG('#maskedSvgContainer', 'radial');
        return null;
    }
}

// ========== 3. Интерактивный SVG с триггерами ==========
async function loadInteractiveSVG() {
    try {
        addLog('Загрузка интерактивного SVG...');

        const result = await svgManager.loadSVGWithGradients('./shape.svg', '#interactiveSvgContainer', {
            fillGradient: {
                type: 'linear',
                angle: 0,
                stops: [
                    { offset: '0%', color: '#3498db' },
                    { offset: '100%', color: '#2ecc71' }
                ]
            },
            width: '100%',
            height: '100%',
            clearContainer: true,
            triggers: [
                {
                    event: 'click',
                    selector: null,
                    actions: [
                        {
                            type: 'custom',
                            callback: (element, svg) => {
                                addLog('🔵 SVG кликнут! Меняем цвет');
                                // Меняем цвет случайным образом
                                const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
                                element.style.backgroundColor = randomColor;
                            }
                        }
                    ]
                },
                {
                    event: 'mouseenter',
                    selector: 'rect, circle, path',
                    actions: [
                        {
                            type: 'fade',
                            opacity: 0.8,
                            duration: 200
                        },
                        {
                            type: 'custom',
                            callback: (element) => {
                                addLog(`🟢 Наведение на элемент: ${element.tagName}`);
                                element.style.cursor = 'pointer';
                            }
                        }
                    ]
                },
                {
                    event: 'mouseleave',
                    selector: 'rect, circle, path',
                    actions: [
                        {
                            type: 'fade',
                            opacity: 1,
                            duration: 200
                        }
                    ]
                }
            ]
        });

        addLog('✓ Интерактивный SVG успешно загружен');

        // Добавляем градиентный бордер
        svgManager.applyAsBorder('#interactiveSvgContainer', {
            type: 'linear',
            stops: [
                { offset: '0%', color: '#ff6b6b' },
                { offset: '50%', color: '#feca57' },
                { offset: '100%', color: '#ff6b6b' }
            ],
            angle: 90
        }, {
            strokeWidth: 3,
            cornerRadius: 10
        });

        addLog('✓ Градиентный бордер применен');

        return result;
    } catch (error) {
        addLog(`✗ Ошибка загрузки интерактивного SVG: ${error.message}`, true);
        createDemoInteractiveSVG('#interactiveSvgContainer');
        return null;
    }
}

// Демо-функция для создания SVG если файл не найден
function createDemoSVG(containerId, gradientType) {
    const container = document.querySelector(containerId);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');

    if (gradientType === 'linear') {
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'demoGrad');
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '100%');

        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#ff6b6b');
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#4ecdc4');

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        svg.appendChild(gradient);
        rect.setAttribute('fill', 'url(#demoGrad)');
    } else {
        rect.setAttribute('fill', '#667eea');
    }

    svg.appendChild(rect);
    container.appendChild(svg);
    addLog(`⚠️ Создан демо SVG (${gradientType}) так как файл shape.svg не найден`, true);
}

function createDemoInteractiveSVG(containerId) {
    const container = document.querySelector(containerId);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 200 200');

    // Создаем несколько интерактивных элементов
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12'];

    for (let i = 0; i < 4; i++) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const x = 50 + (i % 2) * 100;
        const y = 50 + Math.floor(i / 2) * 100;
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '40');
        circle.setAttribute('fill', colors[i]);
        circle.setAttribute('data-id', i);

        // Добавляем обработчики
        circle.addEventListener('mouseenter', () => {
            circle.setAttribute('r', '45');
            addLog(`🟢 Наведение на круг ${i + 1}`);
        });
        circle.addEventListener('mouseleave', () => {
            circle.setAttribute('r', '40');
        });
        circle.addEventListener('click', () => {
            const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
            circle.setAttribute('fill', randomColor);
            addLog(`🔵 Круг ${i + 1} кликнут, цвет изменен`);
        });

        svg.appendChild(circle);
    }

    container.appendChild(svg);
    addLog('⚠️ Создан демо интерактивный SVG', true);

    // Добавляем бордер
    svgManager.applyAsBorder(containerId, {
        type: 'linear',
        stops: [
            { offset: '0%', color: '#ff6b6b' },
            { offset: '100%', color: '#4ecdc4' }
        ],
        angle: 45
    }, {
        strokeWidth: 3,
        cornerRadius: 10
    });
}

const manager = new SVGManager();

// Пример со сложным CSS градиентом
manager.loadSVGWithGradients('./icon.svg', '#container', {
    // Тот самый длинный CSS из генераторов
    fullCss: `
        radial-gradient(at 32% 71%, hsla(77, 95%, 44%, 1) 0%, hsla(77, 95%, 44%, 0) 100%), 
        radial-gradient(at 49% 41%, hsla(192, 91%, 49%, 1) 0%, hsla(192, 91%, 49%, 0) 100%), 
        radial-gradient(at 84% 23%, hsla(245, 96%, 66%, 1) 0%, hsla(245, 96%, 66%, 0) 100%)
    `,
    width: '100%',
    height: '100%',
    clearContainer: true
});

// ========== Запускаем все примеры ==========
async function init() {
    addLog('Начало загрузки...');

    await loadSVGWithDifferentGradients();
    await loadSVGWithMask();
    await loadInteractiveSVG();

    addLog('✅ Все компоненты загружены!');
}

init();
