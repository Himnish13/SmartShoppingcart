import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Debug - Check backend connection
console.log('🚀 Admin Panel Starting...');
fetch('http://localhost:3200/products')
  .then(res => {
    if (res.ok) {
      console.log('✅ Backend is connected!');
    } else {
      console.warn('⚠️ Backend responded but with status:', res.status);
    }
  })
  .catch(err => {
    console.error('❌ Backend not responding. Error:', err.message);
    console.error('Make sure server is running: node server/src/server.js');
  });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
