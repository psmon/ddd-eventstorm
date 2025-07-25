// Mermaid 설정 및 유틸리티 함수
const mermaidConfig = {
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    logLevel: 'error',
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'linear',
        padding: 20,
        nodeSpacing: 50,
        rankSpacing: 50
    },
    themeVariables: {
        primaryColor: '#fff',
        primaryTextColor: '#000',
        primaryBorderColor: '#000',
        lineColor: '#000',
        secondaryColor: '#f5f5f5'
    }
};

// Pan & Zoom 인스턴스 저장
let panzoomInstance = null;

// 안전한 Mermaid 다이어그램 렌더링 함수
async function renderMermaidDiagram(container, diagramText) {
    try {
        // 기존 panzoom 인스턴스 제거
        if (panzoomInstance) {
            panzoomInstance.dispose();
            panzoomInstance = null;
        }
        
        // 컨테이너 초기화
        container.innerHTML = '';
        
        // 다이어그램 텍스트 정리
        const cleanedDiagram = diagramText
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // 제로 너비 문자 제거
            .trim();
        
        console.log('Cleaned diagram:', cleanedDiagram);
        
        // 새 div 생성
        const mermaidDiv = document.createElement('div');
        mermaidDiv.className = 'mermaid';
        mermaidDiv.textContent = cleanedDiagram;
        container.appendChild(mermaidDiv);
        
        // Mermaid 초기화 및 렌더링
        mermaid.initialize(mermaidConfig);
        await mermaid.run({
            nodes: [mermaidDiv],
            suppressErrors: false
        });
        
        // Pan & Zoom 적용
        setTimeout(() => {
            const svgElement = container.querySelector('svg');
            if (svgElement) {
                // SVG 크기 조정
                svgElement.style.maxWidth = 'none';
                svgElement.style.height = 'auto';
                
                // Panzoom 초기화
                panzoomInstance = panzoom(svgElement, {
                    maxZoom: 5,
                    minZoom: 0.1,
                    initialZoom: 0.9,
                    bounds: false,
                    boundsPadding: 0.1,
                    zoomDoubleClickSpeed: 1,
                    smoothScroll: false,
                    beforeWheel: function(e) {
                        // 기본적으로 마우스 휠로 줌 가능
                        return false;
                    },
                    beforeMouseDown: function(e) {
                        // 마우스 드래그로 이동 가능
                        return false;
                    }
                });
                
                // 초기 위치 중앙 정렬
                centerDiagram();
                
                // 사용자 가이드 툴팁 표시 (3초 후 자동 사라짐)
                showPanZoomGuide();
            }
        }, 100);
        
        return true;
    } catch (error) {
        console.error('Mermaid rendering failed:', error);
        
        // 폴백: 간단한 다이어그램 생성
        try {
            const fallbackDiagram = createSimpleDiagram();
            const fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'mermaid';
            fallbackDiv.textContent = fallbackDiagram;
            container.innerHTML = '';
            container.appendChild(fallbackDiv);
            
            await mermaid.run({
                nodes: [fallbackDiv],
                suppressErrors: true
            });
        } catch (fallbackError) {
            // 최종 폴백: 텍스트로 표시
            container.innerHTML = `
                <div class="mermaid-error">
                    <p>다이어그램을 렌더링할 수 없습니다. 아래 Event Storming Board를 참고해주세요.</p>
                    <details>
                        <summary>다이어그램 소스 보기</summary>
                        <pre>${diagramText}</pre>
                    </details>
                </div>
            `;
        }
        
        return false;
    }
}

// 간단한 폴백 다이어그램 생성
function createSimpleDiagram() {
    return `flowchart LR
    A[Event Storming]
    B[Analysis Complete]
    A --> B`;
}

// Pan & Zoom 컨트롤 함수
function zoomIn() {
    if (panzoomInstance) {
        const currentZoom = panzoomInstance.getTransform().scale;
        panzoomInstance.zoomAbs(0, 0, currentZoom * 1.2);
    }
}

function zoomOut() {
    if (panzoomInstance) {
        const currentZoom = panzoomInstance.getTransform().scale;
        panzoomInstance.zoomAbs(0, 0, currentZoom * 0.8);
    }
}

function resetZoom() {
    if (panzoomInstance) {
        panzoomInstance.moveTo(0, 0);
        panzoomInstance.zoomAbs(0, 0, 0.9);
        centerDiagram();
    }
}

function centerDiagram() {
    if (panzoomInstance) {
        const container = document.getElementById('eventStormingDiagram');
        const svg = container.querySelector('svg');
        if (svg && container) {
            const containerRect = container.getBoundingClientRect();
            const svgRect = svg.getBoundingClientRect();
            
            // 중앙 정렬을 위한 오프셋 계산
            const dx = (containerRect.width - svgRect.width * 0.9) / 2;
            const dy = (containerRect.height - svgRect.height * 0.9) / 2;
            
            panzoomInstance.moveTo(dx, dy);
        }
    }
}

// 사용자 가이드 표시
function showPanZoomGuide() {
    const container = document.getElementById('eventStormingDiagram');
    if (!container.querySelector('.panzoom-guide')) {
        const guide = document.createElement('div');
        guide.className = 'panzoom-guide';
        guide.innerHTML = `
            <div style="background: rgba(0,0,0,0.8); color: white; padding: 10px 15px; border-radius: 5px; position: absolute; top: 10px; left: 50%; transform: translateX(-50%); z-index: 1000; font-size: 14px;">
                💡 마우스 드래그로 이동, 휠로 확대/축소
            </div>
        `;
        container.appendChild(guide);
        
        // 3초 후 자동으로 사라짐
        setTimeout(() => {
            guide.style.transition = 'opacity 0.5s';
            guide.style.opacity = '0';
            setTimeout(() => guide.remove(), 500);
        }, 3000);
    }
}