// Mermaid 초기화 (mermaidConfig.js에서 설정 사용)
mermaid.initialize(mermaidConfig);

async function analyzePRD() {
    const prdInput = document.getElementById('prdInput').value.trim();
    
    if (!prdInput) {
        alert('PRD 내용을 입력해주세요.');
        return;
    }

    const analyzeBtn = document.getElementById('analyzeBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultSection = document.getElementById('resultSection');

    analyzeBtn.disabled = true;
    loadingSpinner.style.display = 'block';
    resultSection.style.display = 'none';

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prd: prdInput }),
        });

        if (!response.ok) {
            throw new Error('분석 중 오류가 발생했습니다.');
        }

        const data = await response.json();
        
        displayEventStorming(data.eventStorming);
        displayDiscussion(data.discussion);
        displayExampleMapping(data.exampleMapping);

        resultSection.style.display = 'block';
        
        // Event Storming Board 초기화
        if (!eventStormingBoard) {
            eventStormingBoard = new EventStormingBoard('eventStormingBoard');
        }
        eventStormingBoard.displayEventStorming(data.eventStorming);
    } catch (error) {
        alert(error.message);
    } finally {
        analyzeBtn.disabled = false;
        loadingSpinner.style.display = 'none';
    }
}

async function displayEventStorming(eventStorming) {
    const diagramContainer = document.getElementById('eventStormingDiagram');
    const detailsContainer = document.getElementById('eventStormingDetails');

    console.log('Event Storming Diagram:', eventStorming.diagram);

    // Mermaid 다이어그램 렌더링 (mermaidConfig.js의 안전한 렌더링 함수 사용)
    await renderMermaidDiagram(diagramContainer, eventStorming.diagram);

    let detailsHTML = '<h3>Event Storming 상세</h3>';
    
    if (eventStorming.events && eventStorming.events.length > 0) {
        detailsHTML += '<h4>이벤트</h4><ul>';
        eventStorming.events.forEach(event => {
            detailsHTML += `<li>${event}</li>`;
        });
        detailsHTML += '</ul>';
    }

    if (eventStorming.commands && eventStorming.commands.length > 0) {
        detailsHTML += '<h4>명령</h4><ul>';
        eventStorming.commands.forEach(command => {
            detailsHTML += `<li>${command}</li>`;
        });
        detailsHTML += '</ul>';
    }

    if (eventStorming.actors && eventStorming.actors.length > 0) {
        detailsHTML += '<h4>액터</h4><ul>';
        eventStorming.actors.forEach(actor => {
            detailsHTML += `<li>${actor}</li>`;
        });
        detailsHTML += '</ul>';
    }

    if (eventStorming.policies && eventStorming.policies.length > 0) {
        detailsHTML += '<h4>정책/조건/제약사항</h4><ul>';
        eventStorming.policies.forEach(policy => {
            detailsHTML += `<li>${policy}</li>`;
        });
        detailsHTML += '</ul>';
    }

    if (eventStorming.aggregates && eventStorming.aggregates.length > 0) {
        detailsHTML += '<h4>애그리거트/바운디드 컨텍스트</h4><ul>';
        eventStorming.aggregates.forEach(aggregate => {
            detailsHTML += `<li>${aggregate}</li>`;
        });
        detailsHTML += '</ul>';
    }

    detailsContainer.innerHTML = detailsHTML;
}

function displayDiscussion(discussion) {
    const discussionContainer = document.getElementById('discussionContent');
    let discussionHTML = '';

    discussion.forEach(message => {
        discussionHTML += `
            <div class="discussion-message">
                <div class="author">${message.author}</div>
                <div class="content">${message.content}</div>
            </div>
        `;
    });

    discussionContainer.innerHTML = discussionHTML;
}

function displayExampleMapping(exampleMapping) {
    const mappingContainer = document.getElementById('exampleMappingContent');
    let mappingHTML = '';

    if (exampleMapping.stories) {
        exampleMapping.stories.forEach(story => {
            mappingHTML += `
                <div class="example-card story">
                    <h3>사용자 스토리</h3>
                    <p>${story}</p>
                </div>
            `;
        });
    }

    if (exampleMapping.rules) {
        exampleMapping.rules.forEach(rule => {
            mappingHTML += `
                <div class="example-card rule">
                    <h3>규칙</h3>
                    <p>${rule}</p>
                </div>
            `;
        });
    }

    if (exampleMapping.examples) {
        exampleMapping.examples.forEach(example => {
            mappingHTML += `
                <div class="example-card example">
                    <h3>예제</h3>
                    <p>${example}</p>
                </div>
            `;
        });
    }

    if (exampleMapping.questions) {
        exampleMapping.questions.forEach(question => {
            mappingHTML += `
                <div class="example-card question">
                    <h3>의문점</h3>
                    <p>${question}</p>
                </div>
            `;
        });
    }

    mappingContainer.innerHTML = mappingHTML;
}

// 윈도우 리사이즈 이벤트 처리
window.addEventListener('resize', () => {
    if (eventStormingBoard) {
        eventStormingBoard.resize();
    }
});