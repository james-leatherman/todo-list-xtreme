// Test script to simulate frontend API calls and generate traces
const axios = require('axios');

async function testFrontendAPITracing() {
    console.log('🧪 Testing Frontend API Tracing');
    console.log('================================');
    
    const API_BASE = 'http://localhost:8000';
    
    try {
        // Test 1: Get all todos
        console.log('📋 Testing GET /todos');
        const todosResponse = await axios.get(`${API_BASE}/todos/`);
        console.log(`✅ Got ${todosResponse.data.length} todos`);
        
        // Test 2: Create a new todo
        console.log('➕ Testing POST /todos');
        const newTodo = {
            title: 'Test Todo for Tracing',
            description: 'This todo is created to test OpenTelemetry tracing',
            status: 'todo'
        };
        const createResponse = await axios.post(`${API_BASE}/todos`, newTodo);
        console.log(`✅ Created todo with ID: ${createResponse.data.id}`);
        
        // Test 3: Update the todo
        console.log('✏️  Testing PUT /todos/{id}');
        const updatedTodo = {
            ...createResponse.data,
            status: 'done',
            description: 'Updated for tracing test'
        };
        const updateResponse = await axios.put(`${API_BASE}/todos/${createResponse.data.id}/`, updatedTodo);
        console.log(`✅ Updated todo status to: ${updateResponse.data.status}`);
        
        // Test 4: Get single todo
        console.log('🔍 Testing GET /todos/{id}');
        const getResponse = await axios.get(`${API_BASE}/todos/${createResponse.data.id}/`);
        console.log(`✅ Retrieved todo: ${getResponse.data.title}`);
        
        // Test 5: Delete the todo
        console.log('🗑️  Testing DELETE /todos/{id}');
        await axios.delete(`${API_BASE}/todos/${createResponse.data.id}/`);
        console.log(`✅ Deleted todo with ID: ${createResponse.data.id}`);
        
        console.log('\n🎉 All API tests completed successfully!');
        console.log('📊 Check OTEL collector logs for trace data:');
        console.log('   docker logs backend-otel-collector-1 --tail 20');
        
    } catch (error) {
        console.error('❌ Error during API testing:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testFrontendAPITracing();
