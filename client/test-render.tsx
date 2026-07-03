import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import AttendanceIntelligence from './src/pages/AttendanceIntelligence';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { NotificationProvider } from './src/context/NotificationContext';

try {
  console.log('Rendering AttendanceIntelligence...');
  const html = renderToString(
    <MemoryRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <NotificationProvider>
              <AttendanceIntelligence />
            </NotificationProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
  console.log('Render successful!');
} catch (error) {
  console.error('\n--- CRASH DETECTED ---');
  console.error(error);
}
