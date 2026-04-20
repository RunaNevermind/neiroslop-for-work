const core = new AdaptiveCore();

// 1. Адаптив (Планшет)
core.addBreakpoint("(min-width: 768px) and (max-width: 1024px)", {
    match: (dom) => {
        dom.move("#user-panel", "#tablet-target");
        dom.addClass("#user-panel", "is-highlighted");
    },
    unmatch: (dom) => {
        dom.move("#user-panel", ".header-tools");
        dom.removeClass("#user-panel", "is-highlighted");
    },
});

// 2. Адаптив (Мобилка)
core.addBreakpoint(767, {
    match: (dom) => {
        dom.move("#user-panel", "#mobile-target");
    },
    unmatch: (dom) => {
        if (window.innerWidth > 1024) {
            dom.move("#user-panel", ".header-tools");
        }
    },
});



const svgManager = new SVGManager();

// ========== 1. SVG с разными градиентами для fill и stroke ==========
// Контейнеры: data-svg="gradients" data-src="path/to.svg"
function loadSVGsWithDifferentGradients() {
    return svgManager.loadSVGsFromContainers('[data-svg="gradients"]', {
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
}

// ========== 2. SVG с маской из PNG ==========
// Контейнеры: data-svg="mask" data-src="path/to.svg" data-mask="path/to/mask.png"
function loadSVGsWithMask() {
    return svgManager.loadSVGsFromContainers('[data-svg="mask"]', {
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
}

// ========== 3. Интерактивный SVG с триггерами ==========
// Контейнеры: data-svg="interactive" data-src="path/to.svg"
function loadInteractiveSVGs() {
    return svgManager.loadSVGsFromContainers('[data-svg="interactive"]', {
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
                        callback: (element) => {
                            element.style.backgroundColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
                        }
                    }
                ]
            },
            {
                event: 'mouseenter',
                selector: 'rect, circle, path',
                actions: [
                    { type: 'fade', opacity: 0.8, duration: 200 },
                    {
                        type: 'custom',
                        callback: (element) => {
                            element.style.cursor = 'pointer';
                        }
                    }
                ]
            },
            {
                event: 'mouseleave',
                selector: 'rect, circle, path',
                actions: [
                    { type: 'fade', opacity: 1, duration: 200 }
                ]
            }
        ]
    }).then(results => {
        document.querySelectorAll('[data-svg="interactive"]').forEach(container => {
            svgManager.applyAsBorder(container, {
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
        });
        return results;
    });
}

// ========== 4. SVG со сложным CSS-градиентом ==========
// Контейнеры: data-svg="fullcss" data-src="path/to.svg"
function loadSVGsWithFullCss() {
    return svgManager.loadSVGsFromContainers('[data-svg="fullcss"]', {
        fullCss: `
            radial-gradient(at 32% 71%, hsla(77, 95%, 44%, 1) 0%, hsla(77, 95%, 44%, 0) 100%),
            radial-gradient(at 49% 41%, hsla(192, 91%, 49%, 1) 0%, hsla(192, 91%, 49%, 0) 100%),
            radial-gradient(at 84% 23%, hsla(245, 96%, 66%, 1) 0%, hsla(245, 96%, 66%, 0) 100%)
        `,
        width: '100%',
        height: '100%',
        clearContainer: true
    });
}

// ========== Инициализация ==========
async function init() {
    await loadSVGsWithDifferentGradients();
    await loadSVGsWithMask();
    await loadInteractiveSVGs();
    await loadSVGsWithFullCss();
}

init();
