import React from 'react';
import { LineChart, Line, XAxis, YAxis } from 'recharts';

export function TestChart() {
  const data = [
    { month: "Jan", value: 28 },
    { month: "Feb", value: 29 },
    { month: "Mar", value: 30 }
  ];
  return (
    <div style={{ margin: '20px', border: '2px solid yellow', padding: '20px' }}>
      <h2 style={{ color: 'yellow' }}>TESTCHART RESULT (Recharts Isolation Test)</h2>
      <div id="testchart-container">
        <LineChart width={500} height={150} data={data}>
          <XAxis dataKey="month" stroke="#fff" />
          <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#EF4444" 
            strokeWidth={4} 
            dot={{ r: 5, fill: '#EF4444' }} 
            isAnimationActive={false}
          />
        </LineChart>
      </div>
    </div>
  );
}
