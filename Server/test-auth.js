const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testAuthentication() {
  try {
    console.log('Testing Authentication System...\n');

    // Test 1: Register a new user
    console.log('1. Testing user registration...');
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      age: 25,
      date_of_birth: '1998-01-01',
      favorite_food: 'Pizza'
    };

    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, registerData);
    console.log('✅ Registration successful:', registerResponse.data.message);
    console.log('User ID:', registerResponse.data.user.id);
    console.log('Token received:', !!registerResponse.data.token);
    console.log('');

    const token = registerResponse.data.token;

    // Test 2: Login with the same user
    console.log('2. Testing user login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ Login successful:', loginResponse.data.message);
    console.log('User name:', loginResponse.data.user.name);
    console.log('');

    // Test 3: Get user profile
    console.log('3. Testing profile retrieval...');
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Profile retrieved successfully');
    console.log('Profile data:', profileResponse.data.user);
    console.log('');

    // Test 4: Update user profile
    console.log('4. Testing profile update...');
    const updateResponse = await axios.put(`${API_BASE_URL}/auth/profile`, {
      name: 'Updated Test User',
      age: 26,
      favorite_food: 'Sushi'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Profile updated successfully');
    console.log('Updated name:', updateResponse.data.user.name);
    console.log('Updated age:', updateResponse.data.user.age);
    console.log('');

    // Test 5: Verify token
    console.log('5. Testing token verification...');
    const verifyResponse = await axios.get(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Token verification successful');
    console.log('Token valid:', verifyResponse.data.valid);
    console.log('');

    // Test 6: Test logout
    console.log('6. Testing logout...');
    const logoutResponse = await axios.post(`${API_BASE_URL}/auth/logout`);
    console.log('✅ Logout successful:', logoutResponse.data.message);
    console.log('');

    console.log('🎉 All authentication tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testAuthentication();
