const OpenAI = require('openai');

// 모델 설정을 상위 변수로 분리(gpt-4o, gpt-4o-mini, gpt-3.5-turbo, o3-mini, o3, )
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'o3-mini';

class OpenAIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
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
}

module.exports = new OpenAIService();