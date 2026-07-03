import { JSDOM } from 'jsdom';

// Setup JSDOM
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost'
});
global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock window functions that might be missing
global.window.matchMedia = global.window.matchMedia || function() {
  return { matches: false, addListener: function() {}, removeListener: function() {} };
};

// Mock ResizeObserver for Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock CSS imports for tsx
import Module from 'module';
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id.endsWith('.css')) return {};
  return originalRequire.apply(this, [id]);
};

// Load React and components
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthContext } from './src/context/AuthContext';

// Mocks
const mockUser = { id: 1, role: 'ADMIN', name: 'Test' };
const AuthProvider = ({ children }: any) => (
  <AuthContext.Provider value={{ user: mockUser as any, login: () => {}, logout: () => {}, loading: false }}>
    {children}
  </AuthContext.Provider>
);

// We need to test the components one by one
import CommandCenter from './src/components/attendance-intelligence/CommandCenter';
import RiskAnalysisPanel from './src/components/attendance-intelligence/RiskAnalysisPanel';
import WorkforceMap from './src/components/attendance-intelligence/WorkforceMap';
import LiveAlertsFeed from './src/components/attendance-intelligence/LiveAlertsFeed';
import ExecutiveToolbar from './src/components/attendance-intelligence/ExecutiveToolbar';
import WorkforceHealthCard from './src/components/attendance-intelligence/WorkforceHealthCard';
import RiskHeatmap from './src/components/attendance-intelligence/RiskHeatmap';
import NotificationCenter from './src/components/attendance-intelligence/NotificationCenter';
import WorkforceTable from './src/components/attendance-intelligence/WorkforceTable';
import AttendanceAnalytics from './src/components/attendance-intelligence/AttendanceAnalytics';
import AttendanceForecast from './src/components/attendance-intelligence/AttendanceForecast';

const components = [
  { name: 'ExecutiveToolbar', Component: ExecutiveToolbar },
  { name: 'CommandCenter', Component: () => <CommandCenter activeWorkers={42} lowTrustFlags={[]} /> },
  { name: 'WorkforceHealthCard', Component: WorkforceHealthCard },
  { name: 'WorkforceMap', Component: WorkforceMap },
  { name: 'RiskAnalysisPanel', Component: () => <RiskAnalysisPanel lowTrustFlags={[]} /> },
  { name: 'NotificationCenter', Component: () => <NotificationCenter recentEvents={[]} /> },
  { name: 'LiveAlertsFeed', Component: () => <LiveAlertsFeed recentEvents={[]} /> },
  { name: 'RiskHeatmap', Component: RiskHeatmap },
  { name: 'AttendanceAnalytics', Component: AttendanceAnalytics },
  { name: 'AttendanceForecast', Component: AttendanceForecast },
  { name: 'WorkforceTable', Component: WorkforceTable },
];

async function runTests() {
  console.log('--- STARTING COMPONENT RENDER TESTS ---');
  for (const { name, Component } of components) {
    try {
      console.log(`Testing ${name}...`);
      renderToString(
        <ThemeProvider>
          <AuthProvider>
            <Component />
          </AuthProvider>
        </ThemeProvider>
      );
      console.log(`✅ ${name} rendered successfully!`);
    } catch (err: any) {
      console.error(`❌ ${name} CRASHED:`, err.message);
      console.error(err.stack);
    }
  }
}

runTests();
