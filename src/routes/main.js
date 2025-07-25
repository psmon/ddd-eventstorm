const express = require('express');
const router = express.Router();
const eventStormingService = require('../services/eventStormingService');

router.get('/', (req, res) => {
    res.render('index');
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

module.exports = router;