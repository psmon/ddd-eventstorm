const openaiService = require('./openaiService');
const EventEmitter = require('events');

class EventStormingService extends EventEmitter {
    async analyzePRD(prd, progressCallback) {
        try {
            const totalSteps = 4;
            let currentStep = 0;

            // Progress helper function
            const updateProgress = (step, description, details = {}) => {
                const progress = {
                    step,
                    totalSteps,
                    percentage: Math.round((step / totalSteps) * 100),
                    description,
                    ...details
                };
                
                if (progressCallback) {
                    progressCallback(progress);
                }
                this.emit('progress', progress);
            };

            // 0. 분석 시작
            updateProgress(0, '분석을 시작합니다...', { phase: 'initializing' });
            
            // 약간의 지연을 추가하여 UI 업데이트 보장
            await new Promise(resolve => setTimeout(resolve, 100));

            // 1. Event Storming 생성
            updateProgress(1, 'Event Storming 분석 중...', { phase: 'eventStorming' });
            await new Promise(resolve => setTimeout(resolve, 100)); // UI 업데이트를 위한 짧은 지연
            const eventStormingData = await openaiService.generateEventStorming(prd);
            
            // 2. Mermaid 다이어그램 생성 (LLM 사용)
            updateProgress(2, 'Mermaid 다이어그램 생성 중...', { phase: 'diagram' });
            await new Promise(resolve => setTimeout(resolve, 100));
            const diagram = await openaiService.generateMermaidDiagram(eventStormingData);
            
            // 3. 가상 협업자 토론 생성
            updateProgress(3, '가상 협업자 토론 생성 중...', { phase: 'discussion' });
            await new Promise(resolve => setTimeout(resolve, 100));
            const discussionData = await openaiService.generateDiscussion(eventStormingData);
            
            // 4. Example Mapping 생성
            updateProgress(4, 'Example Mapping 생성 중...', { phase: 'exampleMapping' });
            await new Promise(resolve => setTimeout(resolve, 100));
            const exampleMapping = await openaiService.generateExampleMapping(
                eventStormingData, 
                discussionData
            );

            return {
                eventStorming: {
                    ...eventStormingData,
                    diagram
                },
                discussion: discussionData.discussion,
                exampleMapping
            };
        } catch (error) {
            console.error('Error in analyzePRD:', error);
            this.emit('error', error);
            throw error;
        }
    }

    generateMermaidDiagram(eventStormingData) {
        let diagram = 'graph LR\n';
        const nodeMap = new Map();
        let nodeId = 0;

        // 액터 노드 추가
        if (eventStormingData.actors) {
            eventStormingData.actors.forEach(actor => {
                const id = `A${nodeId++}`;
                nodeMap.set(actor, id);
                diagram += `    ${id}[fa:fa-user ${actor}]\n`;
            });
        }

        // 명령 노드 추가
        if (eventStormingData.commands) {
            eventStormingData.commands.forEach(command => {
                const id = `C${nodeId++}`;
                nodeMap.set(command, id);
                diagram += `    ${id}(${command})\n`;
            });
        }

        // 이벤트 노드 추가
        if (eventStormingData.events) {
            eventStormingData.events.forEach(event => {
                const id = `E${nodeId++}`;
                nodeMap.set(event, id);
                diagram += `    ${id}[${event}]\n`;
            });
        }

        // 정책 노드 추가
        if (eventStormingData.policies) {
            eventStormingData.policies.forEach(policy => {
                const id = `P${nodeId++}`;
                nodeMap.set(policy, id);
                diagram += `    ${id}{${policy}}\n`;
            });
        }

        // 애그리거트 표시
        if (eventStormingData.aggregates) {
            diagram += '\n';
            eventStormingData.aggregates.forEach((aggregate, index) => {
                diagram += `    subgraph ${aggregate}\n`;
                diagram += `    end\n`;
            });
        }

        // 플로우 연결
        if (eventStormingData.flow) {
            diagram += '\n';
            eventStormingData.flow.forEach(flow => {
                const fromId = nodeMap.get(flow.from);
                const toId = nodeMap.get(flow.to);
                if (fromId && toId) {
                    if (flow.type === 'triggers') {
                        diagram += `    ${fromId} -->|triggers| ${toId}\n`;
                    } else if (flow.type === 'applies') {
                        diagram += `    ${fromId} -.->|applies| ${toId}\n`;
                    } else {
                        diagram += `    ${fromId} --> ${toId}\n`;
                    }
                }
            });
        }

        // 스타일 추가
        diagram += '\n';
        diagram += '    classDef event fill:#ffe4b5\n';
        diagram += '    classDef command fill:#add8e6\n';
        diagram += '    classDef actor fill:#90ee90\n';
        diagram += '    classDef policy fill:#ffb6c1\n';

        // 클래스 적용
        eventStormingData.events?.forEach(event => {
            const id = nodeMap.get(event);
            if (id) diagram += `    class ${id} event\n`;
        });

        eventStormingData.commands?.forEach(command => {
            const id = nodeMap.get(command);
            if (id) diagram += `    class ${id} command\n`;
        });

        eventStormingData.actors?.forEach(actor => {
            const id = nodeMap.get(actor);
            if (id) diagram += `    class ${id} actor\n`;
        });

        eventStormingData.policies?.forEach(policy => {
            const id = nodeMap.get(policy);
            if (id) diagram += `    class ${id} policy\n`;
        });

        return diagram;
    }
}

module.exports = new EventStormingService();