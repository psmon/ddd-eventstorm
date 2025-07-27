const OpenAI = require('openai');

// 모델 설정을 상위 변수로 분리(gpt-4o, gpt-4o-mini, gpt-3.5-turbo, o3-mini, o3, )
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

class OpenAIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: 120000, // 120초 타임아웃 설정
            maxRetries: 2, // 재시도 횟수 설정
        });
        this.useMock = process.env.USE_MOCK_API === 'true';
    }

    // 개발 테스트용 모킹 함수
    async mockDelay(duration = 2000) {
        if (this.useMock) {
            await new Promise(resolve => setTimeout(resolve, duration));
        }
    }

    async generateEventStorming(prd) {
        console.time('generateEventStorming');
        console.log('[OpenAI] Starting Event Storming generation...');
        
        const prompt = `
당신은 Domain-Driven Design(DDD)과 Event Storming 전문가입니다. 
주어진 PRD(Product Requirement Document)를 분석하여 Event Storming 결과를 생성해주세요.

PRD:
${prd}

다음 형식으로 Event Storming 결과를 JSON으로 반환해주세요:
{
    "events": ["이벤트1", "이벤트2", ...],
    "commands": ["명령1", "명령2", ...],
    "actors": ["액터1", "액터2", ...],
    "policies": ["정책/조건/제약사항1", ...],
    "aggregates": ["애그리거트/바운디드컨텍스트1", ...],
    "flow": [
        {"from": "액터/명령", "to": "이벤트", "type": "triggers"},
        {"from": "이벤트", "to": "정책", "type": "applies"},
        ...
    ]
}

주의사항:
1. 이벤트는 과거형으로 작성 (예: "주문됨", "결제완료됨")
2. 명령은 동사형으로 작성 (예: "주문하기", "결제하기")
3. 비즈니스 도메인의 흐름 순서대로 정렬
4. DDD 원칙에 따라 바운디드 컨텍스트를 명확히 구분
5. 각 요소는 한국어로 작성
6. flow는 실제 비즈니스 프로세스의 흐름을 정확히 반영해야 함`;

        try {
            // 모킹 모드일 때
            if (this.useMock) {
                await this.mockDelay(2000);
                const mockResult = {
                    events: ["주문 생성됨", "결제 완료됨", "배송 시작됨"],
                    commands: ["주문하기", "결제하기", "배송하기"],
                    actors: ["고객", "관리자"],
                    policies: ["재고 확인 필요", "결제 승인 필요"],
                    aggregates: ["주문", "결제", "배송"],
                    flow: [
                        {"from": "고객", "to": "주문하기", "type": "executes"},
                        {"from": "주문하기", "to": "주문 생성됨", "type": "triggers"}
                    ]
                };
                console.log('[OpenAI] Event Storming generation completed (mock)');
                console.timeEnd('generateEventStorming');
                return mockResult;
            }

            const response = await this.openai.chat.completions.create({
                model: DEFAULT_MODEL,
                messages: [
                    { role: "system", content: "당신은 DDD와 Event Storming 전문가입니다. 항상 유효한 JSON 형식으로 응답하고, 모든 내용은 한국어로 작성하세요." },
                    { role: "user", content: prompt }
                ],
                //temperature: 0.7,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content);
            console.log('[OpenAI] Event Storming generation completed');
            console.timeEnd('generateEventStorming');
            return result;
        } catch (error) {
            console.error('Error generating event storming:', error);
            console.timeEnd('generateEventStorming');
            throw error;
        }
    }

    async generateDiscussion(eventStorming) {
        console.time('generateDiscussion');
        console.log('[OpenAI] Starting Discussion generation...');
        
        const prompt = `
당신은 소프트웨어 개발팀의 가상 협업자들을 시뮬레이션합니다. 
다음 Event Storming 결과를 바탕으로 Example Mapping을 위한 토론을 진행해주세요.

Event Storming 결과:
${JSON.stringify(eventStorming, null, 2)}

다음 역할의 협업자들이 토론에 참여합니다:
- 제품 책임자 (PO): 비즈니스 관점
- 개발자: 기술적 구현 관점
- QA 엔지니어: 테스트 및 품질 관점
- UX 디자이너: 사용자 경험 관점

토론 내용을 다음 JSON 형식으로 반환해주세요:
{
    "discussion": [
        {"author": "역할", "content": "토론 내용"},
        ...
    ]
}

토론은 자연스럽고 건설적이어야 하며, Example Mapping을 위한 구체적인 예제와 규칙을 도출하는 방향으로 진행되어야 합니다.`;

        try {
            const response = await this.openai.chat.completions.create({
                model: DEFAULT_MODEL,
                messages: [
                    { role: "system", content: "당신은 협업하는 소프트웨어 개발 팀의 토론을 시뮬레이션합니다. 항상 유효한 JSON 형식으로 응답하고, 모든 내용은 한국어로 작성하세요." },
                    { role: "user", content: prompt }
                ],
                //temperature: 0.8,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content);
            console.log('[OpenAI] Discussion generation completed');
            console.timeEnd('generateDiscussion');
            return result;
        } catch (error) {
            console.error('Error generating discussion:', error);
            console.timeEnd('generateDiscussion');
            throw error;
        }
    }

    async generateExampleMapping(eventStorming, discussion) {
        console.time('generateExampleMapping');
        console.log('[OpenAI] Starting Example Mapping generation...');
        
        const prompt = `
Event Storming 결과와 팀 토론을 바탕으로 Example Mapping을 생성해주세요.

Event Storming 결과:
${JSON.stringify(eventStorming, null, 2)}

팀 토론:
${JSON.stringify(discussion, null, 2)}

다음 JSON 형식으로 Example Mapping을 반환해주세요:
{
    "stories": ["사용자 스토리1", "사용자 스토리2", ...],
    "rules": ["비즈니스 규칙1", "비즈니스 규칙2", ...],
    "examples": ["구체적 예제1", "구체적 예제2", ...],
    "questions": ["의문점1", "의문점2", ...]
}

주의사항:
1. 사용자 스토리는 "담당자로, 원한다, 무엇을" 형식 또는 간단한 기능 설명
2. 규칙은 명확하고 검증 가능한 비즈니스 규칙
3. 예제는 구체적인 시나리오나 테스트 케이스
4. 의문점은 추가 확인이 필요한 모호한 부분`;

        try {
            const response = await this.openai.chat.completions.create({
                model: DEFAULT_MODEL,
                messages: [
                    { role: "system", content: "당신은 Example Mapping 전문가입니다. 항상 유효한 JSON 형식으로 응답하고, 모든 내용은 한국어로 작성하세요." },
                    { role: "user", content: prompt }
                ],
                //temperature: 0.7,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content);
            console.log('[OpenAI] Example Mapping generation completed');
            console.timeEnd('generateExampleMapping');
            return result;
        } catch (error) {
            console.error('Error generating example mapping:', error);
            console.timeEnd('generateExampleMapping');
            throw error;
        }
    }

    async generateMermaidDiagram(eventStormingData) {
        console.time('generateMermaidDiagram');
        console.log('[OpenAI] Starting Mermaid Diagram generation...');
        
        const prompt = `
Event Storming 데이터를 바탕으로 Mermaid.js 다이어그램을 생성해주세요.

Event Storming 데이터:
${JSON.stringify(eventStormingData, null, 2)}

다음 규칙에 따라 Mermaid 다이어그램을 생성하세요:
1. flowchart LR 형식 사용 (왼쪽에서 오른쪽으로)
2. 액터는 원형: id1((액터명))
3. 명령은 사각형: id2[명령명]
4. 이벤트는 사각형: id3[이벤트명]
5. 정책은 마름모: id4{정책명}
6. 각 노드는 고유한 ID를 가져야 함 (A1, A2, C1, C2, E1, E2, P1, P2 등)
7. 연결선은 --> 사용
8. 특수문자는 피하고, 공백은 유지
9. 한글 사용 가능

예시:
flowchart LR
    A1((고객))
    C1[주문하기]
    E1[주문됨]
    P1{재고확인}
    
    A1 --> C1
    C1 --> E1
    E1 --> P1

다음 JSON 형식으로 반환해주세요:
{
    "diagram": "flowchart LR\\n    A1((고객))\\n    C1[주문하기]\\n    ..."
}

주의사항:
- 모든 노드는 먼저 선언하고 그 다음에 연결관계를 정의
- 특수문자 {{, }}, ((, ))는 노드 정의에만 사용
- ID는 영문자와 숫자만 사용`;

        try {
            const response = await this.openai.chat.completions.create({
                model: DEFAULT_MODEL,
                messages: [
                    { role: "system", content: "당신은 Mermaid.js 다이어그램 전문가입니다. Mermaid v11.9.0 문법에 맞는 정확한 다이어그램을 생성하세요. 항상 유효한 JSON 형식으로 응답하세요." },
                    { role: "user", content: prompt }
                ],
                //temperature: 0.3,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content);
            console.log('[OpenAI] Mermaid Diagram generation completed');
            console.timeEnd('generateMermaidDiagram');
            return result.diagram;
        } catch (error) {
            console.error('Error generating mermaid diagram:', error);
            console.timeEnd('generateMermaidDiagram');
            // 오류 발생 시 기본 다이어그램 생성
            return this.generateFallbackDiagram(eventStormingData);
        }
    }

    generateFallbackDiagram(eventStormingData) {
        let diagram = 'flowchart LR\n';
        let nodeId = 0;
        const nodeMap = new Map();

        // 노드 정의
        if (eventStormingData.actors) {
            eventStormingData.actors.forEach(actor => {
                const id = `A${nodeId++}`;
                nodeMap.set(actor, id);
                diagram += `    ${id}((${actor}))\n`;
            });
        }

        if (eventStormingData.commands) {
            eventStormingData.commands.forEach(command => {
                const id = `C${nodeId++}`;
                nodeMap.set(command, id);
                diagram += `    ${id}[${command}]\n`;
            });
        }

        if (eventStormingData.events) {
            eventStormingData.events.forEach(event => {
                const id = `E${nodeId++}`;
                nodeMap.set(event, id);
                diagram += `    ${id}[${event}]\n`;
            });
        }

        if (eventStormingData.policies) {
            eventStormingData.policies.forEach(policy => {
                const id = `P${nodeId++}`;
                nodeMap.set(policy, id);
                diagram += `    ${id}{${policy}}\n`;
            });
        }

        // 연결 관계
        if (eventStormingData.flow) {
            diagram += '\n';
            eventStormingData.flow.forEach(flow => {
                const fromId = nodeMap.get(flow.from);
                const toId = nodeMap.get(flow.to);
                if (fromId && toId) {
                    diagram += `    ${fromId} --> ${toId}\n`;
                }
            });
        }

        return diagram;
    }

    async generateUbiquitousLanguage(eventStorming, discussion, exampleMapping) {
        console.time('generateUbiquitousLanguage');
        console.log('[OpenAI] Starting Ubiquitous Language generation...');
        
        const prompt = `
당신은 Domain-Driven Design(DDD) 전문가입니다. 
Event Storming, 팀 토론, Example Mapping 결과를 종합 분석하여 도메인의 유비쿼터스 언어(Ubiquitous Language)를 정의해주세요.

Event Storming 결과:
${JSON.stringify(eventStorming, null, 2)}

팀 토론:
${JSON.stringify(discussion, null, 2)}

Example Mapping:
${JSON.stringify(exampleMapping, null, 2)}

다음 JSON 형식으로 유비쿼터스 언어를 반환해주세요:
{
    "ubiquitousLanguage": [
        {
            "boundedContext": "경계구분",
            "englishName": "영문명",
            "koreanName": "한글명",
            "description": "설명"
        }
    ]
}

도메인 용어를 다음 카테고리별로 정리해주세요:
1. 핵심 도메인 용어 (Core Domain Terms)
   - 이벤트, 명령, 액터, 정책, 애그리거트 등
2. 비즈니스 규칙 (Business Rules)
   - 정책, 제약사항, 조건 등
3. 기술 구성요소 (Technical Components)
   - 시스템, 서비스, 모듈 등
4. 사용자 인터페이스 (UI/UX Terms)
   - 화면, 기능, 상호작용 등

주의사항:
1. Event Storming에서 도출된 모든 핵심 용어를 포함
2. 팀 토론에서 언급된 중요 개념 추가
3. Example Mapping의 규칙과 관련된 용어 포함
4. 각 용어는 명확하고 구체적인 설명 제공
5. 영문명은 개발에 사용될 수 있도록 CamelCase 또는 snake_case로 작성
6. 같은 개념이 여러 형태로 나타날 경우 통일된 용어로 정리`;

        try {
            // 모킹 모드일 때
            if (this.useMock) {
                await this.mockDelay(2000);
                const mockResult = {
                    ubiquitousLanguage: [
                        {
                            boundedContext: "Order Domain",
                            englishName: "Order",
                            koreanName: "주문",
                            description: "고객이 상품을 구매하기 위해 생성하는 주문 정보"
                        },
                        {
                            boundedContext: "Order Domain",
                            englishName: "OrderCreated",
                            koreanName: "주문 생성됨",
                            description: "새로운 주문이 성공적으로 생성되었을 때 발생하는 이벤트"
                        },
                        {
                            boundedContext: "Payment Domain",
                            englishName: "Payment",
                            koreanName: "결제",
                            description: "주문에 대한 대금 지불 처리"
                        },
                        {
                            boundedContext: "Business Rule",
                            englishName: "InventoryCheck",
                            koreanName: "재고 확인",
                            description: "주문 전 상품의 재고 여부를 확인하는 정책"
                        }
                    ]
                };
                console.log('[OpenAI] Ubiquitous Language generation completed (mock)');
                console.timeEnd('generateUbiquitousLanguage');
                return mockResult;
            }

            const response = await this.openai.chat.completions.create({
                model: DEFAULT_MODEL,
                messages: [
                    { role: "system", content: "당신은 DDD와 유비쿼터스 언어 정의 전문가입니다. 항상 유효한 JSON 형식으로 응답하고, 모든 내용은 한국어로 작성하세요." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content);
            console.log('[OpenAI] Ubiquitous Language generation completed');
            console.timeEnd('generateUbiquitousLanguage');
            return result;
        } catch (error) {
            console.error('Error generating ubiquitous language:', error);
            console.timeEnd('generateUbiquitousLanguage');
            throw error;
        }
    }

    async generateWorkTickets(eventStorming, exampleMapping, ubiquitousLanguage) {
        console.time('generateWorkTickets');
        console.log('[OpenAI] Starting Work Tickets generation...');
        
        const prompt = `
당신은 프로젝트 관리 전문가이자 소프트웨어 개발 팀 리더입니다.
Event Storming, Example Mapping, 유비쿼터스 언어 정의를 바탕으로 구체적인 작업 티켓(Work Tickets)을 생성해주세요.

Event Storming 결과:
${JSON.stringify(eventStorming, null, 2)}

Example Mapping:
${JSON.stringify(exampleMapping, null, 2)}

유비쿼터스 언어:
${JSON.stringify(ubiquitousLanguage, null, 2)}

다음 JSON 형식으로 작업 티켓을 반환해주세요:
{
    "workTickets": [
        {
            "id": "TASK-001",
            "title": "작업 제목",
            "description": "상세 설명",
            "type": "feature|bug|improvement|task",
            "priority": "high|medium|low",
            "estimatedHours": 8,
            "dependencies": ["TASK-XXX"],
            "assignee": "역할명",
            "sprint": 1,
            "startDate": "2024-01-01",
            "endDate": "2024-01-03",
            "tags": ["백엔드", "API"],
            "acceptanceCriteria": ["완료 조건1", "완료 조건2"]
        }
    ],
    "milestones": [
        {
            "id": "M1",
            "title": "마일스톤 제목",
            "date": "2024-01-15",
            "description": "마일스톤 설명"
        }
    ],
    "timeline": {
        "totalDays": 30,
        "sprints": [
            {
                "number": 1,
                "startDate": "2024-01-01",
                "endDate": "2024-01-14",
                "goal": "스프린트 목표"
            }
        ]
    }
}

주의사항:
1. Event Storming의 각 명령과 이벤트를 구현 가능한 작업으로 분해
2. 우선순위와 의존성을 고려하여 논리적인 순서로 배치
3. 각 작업은 하나의 스프린트 내에서 완료 가능한 크기로 분할
4. 역할은 Product Owner, Developer, QA Engineer, UX Designer 중 선택
5. 실제 개발 가능한 구체적인 작업으로 작성
6. 날짜는 오늘부터 시작하여 현실적인 일정으로 설정`;

        try {
            // 모킹 모드일 때
            if (this.useMock) {
                await this.mockDelay(2000);
                const today = new Date();
                const addDays = (date, days) => {
                    const result = new Date(date);
                    result.setDate(result.getDate() + days);
                    return result.toISOString().split('T')[0];
                };
                
                const mockResult = {
                    workTickets: [
                        {
                            id: "TASK-001",
                            title: "주문 API 엔드포인트 구현",
                            description: "주문 생성, 조회, 수정, 취소 API 구현",
                            type: "feature",
                            priority: "high",
                            estimatedHours: 16,
                            dependencies: [],
                            assignee: "Developer",
                            sprint: 1,
                            startDate: addDays(today, 0),
                            endDate: addDays(today, 2),
                            tags: ["백엔드", "API", "주문"],
                            acceptanceCriteria: [
                                "POST /api/orders - 주문 생성",
                                "GET /api/orders/:id - 주문 조회",
                                "PUT /api/orders/:id - 주문 수정",
                                "DELETE /api/orders/:id - 주문 취소"
                            ]
                        },
                        {
                            id: "TASK-002",
                            title: "주문 도메인 모델 구현",
                            description: "주문 애그리거트 및 엔티티 구현",
                            type: "feature",
                            priority: "high",
                            estimatedHours: 8,
                            dependencies: [],
                            assignee: "Developer",
                            sprint: 1,
                            startDate: addDays(today, 0),
                            endDate: addDays(today, 1),
                            tags: ["백엔드", "도메인"],
                            acceptanceCriteria: [
                                "Order 애그리거트 구현",
                                "OrderItem 엔티티 구현",
                                "비즈니스 규칙 검증 로직"
                            ]
                        },
                        {
                            id: "TASK-003",
                            title: "결제 서비스 통합",
                            description: "외부 결제 게이트웨이 연동",
                            type: "feature",
                            priority: "high",
                            estimatedHours: 24,
                            dependencies: ["TASK-001"],
                            assignee: "Developer",
                            sprint: 1,
                            startDate: addDays(today, 3),
                            endDate: addDays(today, 6),
                            tags: ["백엔드", "결제", "통합"],
                            acceptanceCriteria: [
                                "결제 요청 API 구현",
                                "결제 콜백 처리",
                                "결제 실패 시 롤백 처리"
                            ]
                        }
                    ],
                    milestones: [
                        {
                            id: "M1",
                            title: "MVP 출시",
                            date: addDays(today, 14),
                            description: "기본 주문/결제 기능 완성"
                        },
                        {
                            id: "M2",
                            title: "Beta 출시",
                            date: addDays(today, 30),
                            description: "전체 기능 완성 및 안정화"
                        }
                    ],
                    timeline: {
                        totalDays: 30,
                        sprints: [
                            {
                                number: 1,
                                startDate: addDays(today, 0),
                                endDate: addDays(today, 13),
                                goal: "핵심 주문/결제 기능 구현"
                            },
                            {
                                number: 2,
                                startDate: addDays(today, 14),
                                endDate: addDays(today, 27),
                                goal: "추가 기능 구현 및 안정화"
                            }
                        ]
                    }
                };
                console.log('[OpenAI] Work Tickets generation completed (mock)');
                console.timeEnd('generateWorkTickets');
                return mockResult;
            }

            const response = await this.openai.chat.completions.create({
                model: DEFAULT_MODEL,
                messages: [
                    { role: "system", content: "당신은 프로젝트 관리 전문가입니다. 항상 유효한 JSON 형식으로 응답하고, 모든 내용은 한국어로 작성하세요." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content);
            console.log('[OpenAI] Work Tickets generation completed');
            console.timeEnd('generateWorkTickets');
            return result;
        } catch (error) {
            console.error('Error generating work tickets:', error);
            console.timeEnd('generateWorkTickets');
            throw error;
        }
    }
}

module.exports = new OpenAIService();