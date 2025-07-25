class EventStormingBoard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = this.container.offsetWidth;
        this.height = 600;
        
        // Konva Stage 생성
        this.stage = new Konva.Stage({
            container: containerId,
            width: this.width,
            height: this.height
        });
        
        this.layer = new Konva.Layer();
        this.stage.add(this.layer);
        
        // 스티키 노트 색상 정의
        this.colors = {
            event: '#ff9800',      // 주황색
            command: '#2196f3',    // 파란색
            actor: '#ffeb3b',      // 노란색
            policy: '#e1bee7',     // 라일락색
            aggregate: '#4caf50'   // 녹색
        };
        
        this.noteWidth = 150;
        this.noteHeight = 100;
        this.padding = 20;
    }
    
    createStickyNote(text, type, x, y) {
        const group = new Konva.Group({
            x: x,
            y: y,
            draggable: true
        });
        
        // 스티키 노트 배경
        const rect = new Konva.Rect({
            width: this.noteWidth,
            height: this.noteHeight,
            fill: this.colors[type],
            shadowColor: 'black',
            shadowBlur: 5,
            shadowOffset: { x: 2, y: 2 },
            shadowOpacity: 0.3,
            cornerRadius: 3
        });
        
        // 텍스트
        const textNode = new Konva.Text({
            text: text,
            fontSize: 14,
            fontFamily: 'Arial',
            fill: type === 'actor' ? '#333' : 'white',
            width: this.noteWidth - 20,
            padding: 10,
            align: 'center',
            verticalAlign: 'middle'
        });
        
        // 텍스트를 중앙 정렬
        textNode.offsetY((textNode.height() - this.noteHeight) / 2);
        
        group.add(rect);
        group.add(textNode);
        
        // 호버 효과
        group.on('mouseenter', function() {
            rect.shadowBlur(10);
            rect.shadowOpacity(0.5);
            group.moveToTop();
            document.body.style.cursor = 'move';
        });
        
        group.on('mouseleave', function() {
            rect.shadowBlur(5);
            rect.shadowOpacity(0.3);
            document.body.style.cursor = 'default';
        });
        
        return group;
    }
    
    displayEventStorming(data) {
        // 레이어 초기화
        this.layer.destroyChildren();
        
        let xPos = this.padding;
        let yPos = this.padding;
        let maxHeight = 0;
        
        // 액터 표시
        if (data.actors && data.actors.length > 0) {
            data.actors.forEach((actor, index) => {
                const note = this.createStickyNote(actor, 'actor', xPos, yPos);
                this.layer.add(note);
                xPos += this.noteWidth + this.padding;
                
                if (xPos > this.width - this.noteWidth) {
                    xPos = this.padding;
                    yPos += this.noteHeight + this.padding;
                }
            });
            yPos += this.noteHeight + this.padding * 2;
            xPos = this.padding;
        }
        
        // 명령 표시
        if (data.commands && data.commands.length > 0) {
            data.commands.forEach((command, index) => {
                const note = this.createStickyNote(command, 'command', xPos, yPos);
                this.layer.add(note);
                xPos += this.noteWidth + this.padding;
                
                if (xPos > this.width - this.noteWidth) {
                    xPos = this.padding;
                    yPos += this.noteHeight + this.padding;
                }
            });
            yPos += this.noteHeight + this.padding * 2;
            xPos = this.padding;
        }
        
        // 이벤트 표시
        if (data.events && data.events.length > 0) {
            data.events.forEach((event, index) => {
                const note = this.createStickyNote(event, 'event', xPos, yPos);
                this.layer.add(note);
                xPos += this.noteWidth + this.padding;
                
                if (xPos > this.width - this.noteWidth) {
                    xPos = this.padding;
                    yPos += this.noteHeight + this.padding;
                }
            });
            yPos += this.noteHeight + this.padding * 2;
            xPos = this.padding;
        }
        
        // 정책 표시
        if (data.policies && data.policies.length > 0) {
            data.policies.forEach((policy, index) => {
                const note = this.createStickyNote(policy, 'policy', xPos, yPos);
                this.layer.add(note);
                xPos += this.noteWidth + this.padding;
                
                if (xPos > this.width - this.noteWidth) {
                    xPos = this.padding;
                    yPos += this.noteHeight + this.padding;
                }
            });
            yPos += this.noteHeight + this.padding * 2;
            xPos = this.padding;
        }
        
        // 애그리거트 표시
        if (data.aggregates && data.aggregates.length > 0) {
            data.aggregates.forEach((aggregate, index) => {
                const note = this.createStickyNote(aggregate, 'aggregate', xPos, yPos);
                this.layer.add(note);
                xPos += this.noteWidth + this.padding;
                
                if (xPos > this.width - this.noteWidth) {
                    xPos = this.padding;
                    yPos += this.noteHeight + this.padding;
                }
            });
        }
        
        this.layer.draw();
    }
    
    resize() {
        this.width = this.container.offsetWidth;
        this.stage.width(this.width);
        this.layer.draw();
    }
}

// 전역 변수로 보드 인스턴스 저장
let eventStormingBoard = null;