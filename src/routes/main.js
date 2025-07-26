const express = require('express');
const router = express.Router();
const eventStormingService = require('../services/eventStormingService');
const sharingService = require('../services/sharingService');

router.get('/', (req, res) => {
    res.render('index', { shareData: null });
});

router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SSE를 위한 클라이언트 관리
const sseClients = new Map();

router.get('/api/analyze/progress/:clientId', (req, res) => {
    const clientId = req.params.clientId;
    
    // SSE 헤더 설정
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'X-Accel-Buffering': 'no' // Nginx 버퍼링 비활성화
    });

    // 클라이언트 연결 저장
    sseClients.set(clientId, res);
    
    // 초기 연결 메시지
    res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);
    res.flushHeaders(); // 헤더 즉시 전송

    // 연결 종료 시 클라이언트 제거
    req.on('close', () => {
        sseClients.delete(clientId);
    });
});

router.post('/api/analyze', async (req, res) => {
    try {
        const { prd, clientId } = req.body;
        
        if (!prd) {
            return res.status(400).json({ error: 'PRD 내용이 필요합니다.' });
        }

        // SSE 클라이언트가 있으면 진행 상황 전송
        const progressCallback = clientId && sseClients.has(clientId) ? (progress) => {
            const sseClient = sseClients.get(clientId);
            if (sseClient) {
                const message = JSON.stringify({ type: 'progress', ...progress });
                console.log(`[SSE] Sending progress to ${clientId}:`, message);
                sseClient.write(`data: ${message}\n\n`);
                
                // 강제로 플러시하여 즉시 전송
                if (sseClient.flush) sseClient.flush();
            }
        } : null;
        
        console.log(`[API] Starting analysis for clientId: ${clientId}, SSE client exists: ${sseClients.has(clientId)}`);

        const result = await eventStormingService.analyzePRD(prd, progressCallback);
        
        // 완료 메시지 전송
        if (progressCallback) {
            const sseClient = sseClients.get(clientId);
            if (sseClient) {
                sseClient.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
                sseClient.end();
                sseClients.delete(clientId);
            }
        }
        
        res.json(result);
    } catch (error) {
        console.error('Error analyzing PRD:', error);
        
        // 에러 메시지 SSE로 전송
        const { clientId } = req.body;
        if (clientId && sseClients.has(clientId)) {
            const sseClient = sseClients.get(clientId);
            sseClient.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
            sseClient.end();
            sseClients.delete(clientId);
        }
        
        res.status(500).json({ error: '분석 중 오류가 발생했습니다.' });
    }
});

router.post('/api/share', async (req, res) => {
    try {
        const { 
            prdText, 
            eventStormingData, 
            mermaidDiagram, 
            discussions, 
            exampleMappingData, 
            ubiquitousLanguageData,
            workTicketsData,
            milestonesData,
            timelineData
        } = req.body;
        
        if (!prdText || !eventStormingData) {
            return res.status(400).json({ error: '공유할 데이터가 불완전합니다.' });
        }

        const shareId = await sharingService.createShare({
            prdText,
            eventStormingData,
            mermaidDiagram,
            discussions,
            exampleMappingData,
            ubiquitousLanguageData,
            workTicketsData,
            milestonesData,
            timelineData
        });

        const shareUrl = sharingService.getShareUrl(shareId, req.protocol, req.get('host'));
        
        res.json({ shareId, shareUrl });
    } catch (error) {
        console.error('Error creating share:', error);
        res.status(500).json({ error: '공유 링크 생성 중 오류가 발생했습니다.' });
    }
});

router.get('/share/:shareId', async (req, res) => {
    try {
        const { shareId } = req.params;
        const shareData = await sharingService.getShare(shareId);
        
        if (!shareData) {
            return res.status(404).send('공유된 분석을 찾을 수 없습니다.');
        }

        res.render('index', { shareData });
    } catch (error) {
        console.error('Error retrieving share:', error);
        res.status(500).send('공유된 분석을 불러오는 중 오류가 발생했습니다.');
    }
});

module.exports = router;