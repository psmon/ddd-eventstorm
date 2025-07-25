const axios = require('axios');

async function testSharing() {
    const baseUrl = 'http://localhost:3000';
    
    console.log('1. Testing health endpoint...');
    try {
        const healthRes = await axios.get(`${baseUrl}/health`);
        console.log('✅ Health check passed:', healthRes.data);
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
    }
    
    console.log('\n2. Testing share creation...');
    try {
        const shareData = {
            prdText: 'Test PRD content',
            eventStormingData: {
                events: ['Event 1', 'Event 2'],
                commands: ['Command 1'],
                actors: ['User'],
                policies: ['Policy 1'],
                aggregates: ['Aggregate 1'],
                diagram: 'graph TD\nA[Start] --> B[End]'
            },
            mermaidDiagram: 'graph TD\nA[Start] --> B[End]',
            discussions: [
                { author: 'Developer', content: 'Test discussion' }
            ],
            exampleMappingData: {
                stories: ['Story 1'],
                rules: ['Rule 1'],
                examples: ['Example 1'],
                questions: ['Question 1']
            }
        };
        
        const shareRes = await axios.post(`${baseUrl}/api/share`, shareData);
        console.log('✅ Share created:', shareRes.data);
        
        const shareId = shareRes.data.shareId;
        
        console.log('\n3. Testing share retrieval...');
        const getShareRes = await axios.get(`${baseUrl}/share/${shareId}`);
        console.log('✅ Share retrieved successfully (HTML page returned)');
        
    } catch (error) {
        console.error('❌ Share test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Check if axios is installed
try {
    require('axios');
    testSharing();
} catch (error) {
    console.log('Installing axios...');
    require('child_process').execSync('npm install axios', { stdio: 'inherit' });
    console.log('Please run this script again.');
}