const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '10mb' })); // JSON 본문 크기 제한을 10MB로 증가
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' })); // URL 인코딩 본문 크기 제한도 10MB로 증가
app.use(express.static(path.join(__dirname, 'public')));

// SSE를 위한 설정
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const mainRoutes = require('./routes/main');
app.use('/', mainRoutes);

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    if (process.env.USE_MOCK_API === 'true') {
        console.log('🔧 Mock mode enabled - using simulated delays instead of OpenAI API');
    }
    console.log(`📝 Test SSE at: http://localhost:${PORT}/test-sse.html`);
});

// 서버 타임아웃을 120초로 설정 (기본값은 120초이지만 명시적으로 설정)
server.timeout = 120000; // 120초
server.keepAliveTimeout = 65000; // 65초 (ALB/ELB 타임아웃보다 약간 길게 설정)