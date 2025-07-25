// Mermaid 초기화 (mermaidConfig.js에서 설정 사용)
mermaid.initialize(mermaidConfig);

// 분석 결과 저장용 전역 변수
let currentAnalysisData = null;

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
        
        // 분석 결과 저장
        currentAnalysisData = {
            prdText: prdInput,
            eventStormingData: data.eventStorming,
            mermaidDiagram: data.eventStorming.diagram,
            discussions: data.discussion,
            exampleMappingData: data.exampleMapping
        };
        
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

// 공유 기능 함수들
async function shareAnalysis() {
    if (!currentAnalysisData) {
        alert('공유할 분석 결과가 없습니다.');
        return;
    }

    const shareBtn = document.getElementById('shareBtn');
    shareBtn.disabled = true;
    shareBtn.textContent = '공유 링크 생성 중...';

    try {
        const response = await fetch('/api/share', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(currentAnalysisData),
        });

        if (!response.ok) {
            throw new Error('공유 링크 생성에 실패했습니다.');
        }

        const { shareUrl } = await response.json();
        
        document.getElementById('shareLink').value = shareUrl;
        document.getElementById('shareResult').style.display = 'block';
        
        shareBtn.textContent = '🔗 새 링크 생성';
    } catch (error) {
        alert(error.message);
        shareBtn.textContent = '🔗 공유하기';
    } finally {
        shareBtn.disabled = false;
    }
}

function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    shareLink.select();
    shareLink.setSelectionRange(0, 99999); // 모바일 지원
    
    try {
        document.execCommand('copy');
        
        const copyBtn = event.target;
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ 복사됨!';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    } catch (err) {
        alert('복사에 실패했습니다. 직접 선택하여 복사해주세요.');
    }
}

// 공유된 데이터로 초기화
window.addEventListener('DOMContentLoaded', () => {
    if (window.sharedAnalysisData) {
        const data = window.sharedAnalysisData;
        
        // PRD 텍스트 표시
        document.getElementById('prdInput').value = data.prdText;
        
        // 분석 결과 표시
        displayEventStorming(data.eventStormingData);
        displayDiscussion(data.discussions);
        displayExampleMapping(data.exampleMappingData);
        
        // 결과 섹션 표시
        document.getElementById('resultSection').style.display = 'block';
        
        // Event Storming Board 초기화
        if (!eventStormingBoard) {
            eventStormingBoard = new EventStormingBoard('eventStormingBoard');
        }
        eventStormingBoard.displayEventStorming(data.eventStormingData);
        
        // 현재 분석 데이터 저장
        currentAnalysisData = data;
        
        // 입력 필드 읽기 전용으로 설정
        document.getElementById('prdInput').readOnly = true;
        document.getElementById('analyzeBtn').style.display = 'none';
        
        // 공유 모드 표시
        const h1 = document.querySelector('h1');
        h1.innerHTML += ' <span style="color: #4CAF50; font-size: 0.8em;">(공유된 분석)</span>';
    }
});