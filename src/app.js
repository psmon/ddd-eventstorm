const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    if (process.env.USE_MOCK_API === 'true') {
        console.log('🔧 Mock mode enabled - using simulated delays instead of OpenAI API');
    }
    console.log(`📝 Test SSE at: http://localhost:${PORT}/test-sse.html`);
});