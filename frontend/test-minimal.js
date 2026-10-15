const babel = require('@babel/core');

const testCode = `
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
`;

try {
  const result = babel.parseSync(testCode, {
    sourceType: 'module',
    filename: 'test.js',
    presets: [
      [require.resolve('babel-preset-react-app'), { runtime: 'automatic' }]
    ]
  });
  console.log('Minimal test parsed successfully');
} catch (e) {
  console.log('Error:', e.message);
  console.log('Line:', e.loc?.line, 'Column:', e.loc?.column);
}