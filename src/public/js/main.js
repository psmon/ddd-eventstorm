// Mermaid 초기화 (mermaidConfig.js에서 설정 사용)
mermaid.initialize(mermaidConfig);

// 분석 결과 저장용 전역 변수
let currentAnalysisData = null;

// 진행 상황 업데이트 함수
function updateProgressUI(progress) {
    console.log('Progress update:', progress); // 디버깅용
    
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressSteps = document.querySelectorAll('.progress-step');
    
    // 진행률 바 업데이트 (애니메이션 효과)
    requestAnimationFrame(() => {
        progressFill.style.width = `${progress.percentage}%`;
        progressFill.textContent = `${progress.percentage}%`;
    });
    
    // 진행 상황 텍스트 업데이트
    progressText.textContent = progress.description;
    
    // 단계별 상태 업데이트
    progressSteps.forEach((step, index) => {
        const stepNumber = index + 1;
        
        // 타임아웃을 사용하여 순차적 애니메이션 효과
        setTimeout(() => {
            if (stepNumber < progress.step) {
                step.classList.remove('active');
                step.classList.add('completed');
            } else if (stepNumber === progress.step) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        }, stepNumber * 50);
    });
}

// 진행 상황 초기화
function resetProgress() {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressSteps = document.querySelectorAll('.progress-step');
    
    progressFill.style.width = '0%';
    progressFill.textContent = '';
    progressText.textContent = '분석 준비 중...';
    progressSteps.forEach(step => step.classList.remove('active', 'completed'));
}

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
    
    // 진행 상황 초기화
    resetProgress();
    
    // 고유 클라이언트 ID 생성
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // SSE 연결 설정
    console.log(`[SSE] Connecting with clientId: ${clientId}`);
    const eventSource = new EventSource(`/api/analyze/progress/${clientId}`);
    
    let sseConnected = false;
    
    eventSource.onopen = () => {
        console.log('[SSE] Connection opened');
    };
    
    eventSource.onmessage = (event) => {
        console.log('[SSE] Message received:', event.data);
        try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'connected') {
                console.log('[SSE] Connected successfully');
                sseConnected = true;
                
                // SSE 연결이 확인되면 분석 시작
                startAnalysis();
            } else if (data.type === 'progress') {
                console.log('[SSE] Progress update:', data);
                updateProgressUI(data);
            } else if (data.type === 'complete' || data.type === 'error') {
                console.log('[SSE] Closing connection:', data.type);
                eventSource.close();
            }
        } catch (error) {
            console.error('[SSE] Error parsing message:', error);
        }
    };
    
    eventSource.onerror = (error) => {
        console.error('[SSE] Connection error:', error);
        eventSource.close();
        
        // SSE 연결 실패 시 일반 분석 진행
        if (!sseConnected) {
            console.warn('[SSE] Connection failed, proceeding without progress updates');
            sseConnected = true; // 강제로 설정하여 분석 진행
            startAnalysis();
        }
    };
    
    // 3초 후에도 연결이 안 되면 강제로 시작
    setTimeout(() => {
        if (!sseConnected) {
            console.warn('[SSE] Connection timeout, proceeding without progress updates');
            sseConnected = true;
            eventSource.close();
            startAnalysis();
        }
    }, 3000);
    
    // 분석 시작 함수
    const startAnalysis = async () => {
        if (!sseConnected) {
            console.warn('[SSE] Not connected yet, waiting...');
            return;
        }
        
        try {
            console.log('[SSE] Starting analysis request...');
            
            // AbortController를 사용한 타임아웃 설정
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000); // 120초 타임아웃
            
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prd: prdInput, clientId }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId); // 응답이 오면 타임아웃 해제

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
            exampleMappingData: data.exampleMapping,
            ubiquitousLanguageData: data.ubiquitousLanguage,
            workTicketsData: data.workTickets,
            milestonesData: data.milestones,
            timelineData: data.timeline
        };
        
        displayEventStorming(data.eventStorming);
        displayDiscussion(data.discussion);
        displayExampleMapping(data.exampleMapping);
        
        // 유비쿼터스 언어 표시
        if (data.ubiquitousLanguage) {
            displayUbiquitousLanguage(data.ubiquitousLanguage);
        }

        // 작업 티켓 및 타임라인 표시
        if (data.workTickets || data.milestones || data.timeline) {
            displayWorkTickets(data.workTickets, data.milestones, data.timeline);
        }

        resultSection.style.display = 'block';
        
        // Event Storming Board 초기화
        if (!eventStormingBoard) {
            eventStormingBoard = new EventStormingBoard('eventStormingBoard');
        }
        eventStormingBoard.displayEventStorming(data.eventStorming);
        } catch (error) {
            if (error.name === 'AbortError') {
                alert('요청 시간이 초과되었습니다. 다시 시도해주세요.');
            } else {
                alert(error.message);
            }
            eventSource.close();
        } finally {
            // 분석 완료 시 모든 단계를 완료 상태로 표시
            const progressSteps = document.querySelectorAll('.progress-step');
            progressSteps.forEach(step => {
                step.classList.remove('active');
                step.classList.add('completed');
            });
            
            // 진행률 100%로 설정
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            progressFill.style.width = '100%';
            progressFill.textContent = '100%';
            progressText.textContent = '분석 완료!';
            
            // 1초 후 로딩 스피너 숨기기
            setTimeout(() => {
                analyzeBtn.disabled = false;
                loadingSpinner.style.display = 'none';
            }, 1000);
        }
    };
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

function displayUbiquitousLanguage(ubiquitousLanguage) {
    const tableBody = document.getElementById('ubiquitousLanguageTableBody');
    let tableHTML = '';
    
    if (!ubiquitousLanguage || ubiquitousLanguage.length === 0) {
        tableHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
                    유비쿼터스 언어가 정의되지 않았습니다.
                </td>
            </tr>
        `;
    } else {
        ubiquitousLanguage.forEach(term => {
            tableHTML += `
                <tr>
                    <td>${term.boundedContext || '-'}</td>
                    <td>${term.englishName || '-'}</td>
                    <td>${term.koreanName || '-'}</td>
                    <td>${term.description || '-'}</td>
                </tr>
            `;
        });
    }
    
    tableBody.innerHTML = tableHTML;
}

// 전역 변수로 timeline 인스턴스 저장
let timeline = null;
let timelineItems = null;
let timelineGroups = null;

function displayWorkTickets(workTickets, milestones, timelineData) {
    // 작업 티켓 카드 렌더링
    if (workTickets && workTickets.length > 0) {
        const ticketsContainer = document.getElementById('workTicketsContent');
        let ticketsHTML = '';
        
        workTickets.forEach(ticket => {
            const priorityClass = `priority-${ticket.priority}`;
            const tagsHTML = ticket.tags ? ticket.tags.map(tag => `<span class="ticket-tag">${tag}</span>`).join('') : '';
            
            ticketsHTML += `
                <div class="work-ticket-card" data-ticket-id="${ticket.id}">
                    <div class="ticket-header">
                        <span class="ticket-id">${ticket.id}</span>
                        <span class="ticket-priority ${priorityClass}">${ticket.priority.toUpperCase()}</span>
                    </div>
                    <h4 class="ticket-title">${ticket.title}</h4>
                    <p class="ticket-description">${ticket.description}</p>
                    <div class="ticket-meta">
                        <div class="ticket-meta-item">
                            <span>👤</span>
                            <span>${ticket.assignee}</span>
                        </div>
                        <div class="ticket-meta-item">
                            <span>⏱️</span>
                            <span>${ticket.estimatedHours}h</span>
                        </div>
                        <div class="ticket-meta-item">
                            <span>🏃</span>
                            <span>Sprint ${ticket.sprint}</span>
                        </div>
                    </div>
                    <div class="ticket-tags">${tagsHTML}</div>
                    <div class="ticket-dates">
                        <span>시작: ${formatDate(ticket.startDate)}</span>
                        <span>종료: ${formatDate(ticket.endDate)}</span>
                    </div>
                </div>
            `;
        });
        
        ticketsContainer.innerHTML = ticketsHTML;
    }
    
    // 마일스톤 렌더링
    if (milestones && milestones.length > 0) {
        const milestonesContainer = document.getElementById('milestonesContent');
        let milestonesHTML = '';
        
        milestones.forEach(milestone => {
            milestonesHTML += `
                <div class="milestone-card">
                    <h4 class="milestone-title">${milestone.title}</h4>
                    <div class="milestone-date">📅 ${formatDate(milestone.date)}</div>
                    <p class="milestone-description">${milestone.description}</p>
                </div>
            `;
        });
        
        milestonesContainer.innerHTML = milestonesHTML;
    }
    
    // 타임라인 생성
    createTimeline(workTickets, milestones, timelineData);
}

function createTimeline(workTickets, milestones, timelineData) {
    const container = document.getElementById('timeline');
    
    // 아이템 데이터 준비
    const items = [];
    
    // 작업 티켓을 타임라인 아이템으로 변환
    if (workTickets) {
        workTickets.forEach(ticket => {
            items.push({
                id: ticket.id,
                content: `<strong>${ticket.id}</strong><br>${ticket.title}`,
                start: ticket.startDate,
                end: ticket.endDate,
                group: ticket.assignee,
                className: ticket.type,
                title: `${ticket.title}\n담당: ${ticket.assignee}\n예상: ${ticket.estimatedHours}시간`
            });
        });
    }
    
    // 마일스톤을 타임라인 아이템으로 변환
    if (milestones) {
        milestones.forEach(milestone => {
            items.push({
                id: milestone.id,
                content: `<strong>🎯 ${milestone.title}</strong>`,
                start: milestone.date,
                type: 'point',
                className: 'milestone',
                title: milestone.description
            });
        });
    }
    
    // 그룹(담당자) 설정
    const groups = [
        { id: 'Developer', content: '개발자' },
        { id: 'QA Engineer', content: 'QA 엔지니어' },
        { id: 'UX Designer', content: 'UX 디자이너' },
        { id: 'Product Owner', content: '제품 책임자' }
    ];
    
    // DataSet 생성
    timelineItems = new vis.DataSet(items);
    timelineGroups = new vis.DataSet(groups);
    
    // 타임라인 옵션
    const options = {
        groupOrder: 'content',
        height: '400px',
        stack: false,
        showMajorLabels: true,
        showCurrentTime: true,
        zoomMin: 1000 * 60 * 60 * 24,        // 1일
        zoomMax: 1000 * 60 * 60 * 24 * 365,  // 1년
        locale: 'ko',
        tooltip: {
            followMouse: true,
            overflowMethod: 'cap'
        },
        format: {
            minorLabels: {
                minute: 'h:mma',
                hour: 'ha',
                weekday: 'ddd D',
                day: 'D',
                week: 'w',
                month: 'MMM',
                year: 'YYYY'
            },
            majorLabels: {
                minute: 'ddd D MMMM',
                hour: 'ddd D MMMM',
                weekday: 'MMMM YYYY',
                day: 'MMMM YYYY',
                week: 'MMMM YYYY',
                month: 'YYYY',
                year: ''
            }
        }
    };
    
    // 타임라인 생성
    timeline = new vis.Timeline(container, timelineItems, timelineGroups, options);
    
    // 타임라인 이벤트 핸들러
    timeline.on('select', function (properties) {
        if (properties.items.length > 0) {
            const selectedId = properties.items[0];
            const ticketCard = document.querySelector(`[data-ticket-id="${selectedId}"]`);
            if (ticketCard) {
                ticketCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                ticketCard.style.animation = 'pulse 0.5s ease-in-out';
                setTimeout(() => {
                    ticketCard.style.animation = '';
                }, 500);
            }
        }
    });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// 타임라인 컨트롤 함수들
function zoomInTimeline() {
    if (timeline) {
        const range = timeline.getWindow();
        const interval = range.end - range.start;
        const newInterval = interval * 0.5;
        const center = (range.start.valueOf() + range.end.valueOf()) / 2;
        timeline.setWindow(center - newInterval / 2, center + newInterval / 2);
    }
}

function zoomOutTimeline() {
    if (timeline) {
        const range = timeline.getWindow();
        const interval = range.end - range.start;
        const newInterval = interval * 2;
        const center = (range.start.valueOf() + range.end.valueOf()) / 2;
        timeline.setWindow(center - newInterval / 2, center + newInterval / 2);
    }
}

function fitTimeline() {
    if (timeline) {
        timeline.fit();
    }
}

function toggleTimelineView() {
    if (timeline) {
        const currentStack = timeline.options.stack;
        timeline.setOptions({ stack: !currentStack });
    }
}

function filterTimeline() {
    const filterValue = document.getElementById('timelineFilter').value;
    
    if (!timelineItems) return;
    
    const allItems = timelineItems.get();
    let filteredItems = allItems;
    
    switch (filterValue) {
        case 'sprint1':
            filteredItems = allItems.filter(item => item.group && item.content.includes('Sprint 1'));
            break;
        case 'sprint2':
            filteredItems = allItems.filter(item => item.group && item.content.includes('Sprint 2'));
            break;
        case 'high':
            filteredItems = allItems.filter(item => item.className !== 'milestone' && item.title && item.title.includes('high'));
            break;
        case 'feature':
            filteredItems = allItems.filter(item => item.className === 'feature');
            break;
    }
    
    timeline.setItems(filteredItems);
}

// 윈도우 리사이즈 이벤트 처리
window.addEventListener('resize', () => {
    if (eventStormingBoard) {
        eventStormingBoard.resize();
    }
    if (timeline) {
        timeline.redraw();
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
        // AbortController를 사용한 타임아웃 설정
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃
        
        const response = await fetch('/api/share', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(currentAnalysisData),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error('공유 링크 생성에 실패했습니다.');
        }

        const { shareUrl } = await response.json();
        
        document.getElementById('shareLink').value = shareUrl;
        document.getElementById('shareResult').style.display = 'block';
        
        shareBtn.textContent = '🔗 새 링크 생성';
    } catch (error) {
        if (error.name === 'AbortError') {
            alert('요청 시간이 초과되었습니다. 다시 시도해주세요.');
        } else {
            alert(error.message);
        }
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
        
        // 유비쿼터스 언어 표시
        if (data.ubiquitousLanguageData) {
            displayUbiquitousLanguage(data.ubiquitousLanguageData);
        }
        
        // 작업 티켓 및 타임라인 표시
        if (data.workTicketsData || data.milestonesData || data.timelineData) {
            displayWorkTickets(data.workTicketsData, data.milestonesData, data.timelineData);
        }
        
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