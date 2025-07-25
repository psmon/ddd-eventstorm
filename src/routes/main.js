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

router.post('/api/analyze', async (req, res) => {
    try {
        const { prd } = req.body;
        
        if (!prd) {
            return res.status(400).json({ error: 'PRD 내용이 필요합니다.' });
        }

        const result = await eventStormingService.analyzePRD(prd);
        res.json(result);
    } catch (error) {
        console.error('Error analyzing PRD:', error);
        res.status(500).json({ error: '분석 중 오류가 발생했습니다.' });
    }
});

router.post('/api/share', async (req, res) => {
    try {
        const { prdText, eventStormingData, mermaidDiagram, discussions, exampleMappingData } = req.body;
        
        if (!prdText || !eventStormingData) {
            return res.status(400).json({ error: '공유할 데이터가 불완전합니다.' });
        }

        const shareId = await sharingService.createShare({
            prdText,
            eventStormingData,
            mermaidDiagram,
            discussions,
            exampleMappingData
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