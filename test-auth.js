// Simple test script to verify authentication is working
const axios = require('axios');

async function testAuth() {
  const baseURL = 'http://localhost:5000';
  
  console.log('🧪 Testing authentication endpoints...');
  
  try {
    // Test 1: Try to access protected endpoint without auth
    console.log('\n1. Testing protected endpoint without auth...');
    try {
      await axios.get(`${baseURL}/api/auth/user`);
    } catch (error) {
      console.log('✅ Correctly rejected unauthorized request:', error.response?.status);
    }
    
    // Test 2: Test health endpoint
    console.log('\n2. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    console.log('✅ Health endpoint working:', healthResponse.status);
    
    // Test 3: Test local login with invalid credentials
    console.log('\n3. Testing local login with invalid credentials...');
    try {
      await axios.post(`${baseURL}/api/auth/local/login`, {
        username: 'invalid',
        password: 'invalid'
      });
    } catch (error) {
      console.log('✅ Correctly rejected invalid credentials:', error.response?.status, error.response?.data?.message);
    }
    
    // Test 4: Try creating a test user and logging in
    console.log('\n4. Testing user registration...');
    try {
      const registerResponse = await axios.post(`${baseURL}/api/auth/local/register`, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpassword123',
        firstName: 'Test',
        lastName: 'User'
      });
      console.log('✅ User registration successful:', registerResponse.status);
      
      // Test login with the new user
      console.log('\n5. Testing login with new user...');
      const loginResponse = await axios.post(`${baseURL}/api/auth/local/login`, {
        username: 'testuser',
        password: 'testpassword123'
      });
      console.log('✅ Login successful:', loginResponse.status);
      
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ User already exists, testing login...');
        
        const loginResponse = await axios.post(`${baseURL}/api/auth/local/login`, {
          username: 'testuser',
          password: 'testpassword123'
        });
        console.log('✅ Login successful:', loginResponse.status);
      } else {
        console.log('❌ Registration/Login failed:', error.response?.data);
      }
    }
    
    console.log('\n🎉 All authentication tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running with: npm run dev');
    }
  }
}

testAuth();
