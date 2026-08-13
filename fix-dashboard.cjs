const fs = require('fs');

let content = fs.readFileSync('client/src/pages/Dashboard.tsx', 'utf8');

// Fix grids
content = content.replace(/className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"/g, 'className="dashboard-grid-4" style={{ marginBottom: \'24px\' }}');
content = content.replace(/className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"/g, 'className="dashboard-grid-2" style={{ marginBottom: \'24px\' }}');
content = content.replace(/className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"/g, 'className="dashboard-grid-2" style={{ marginBottom: \'24px\' }}');
content = content.replace(/className="grid grid-cols-1 lg:grid-cols-2 gap-6"/g, 'className="dashboard-grid-2" style={{ marginBottom: \'24px\' }}');
content = content.replace(/className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full"/g, 'className="dashboard-grid-2" style={{ height: \'auto\', margin: \'auto 0\' }}');
content = content.replace(/className="grid grid-cols-1 sm:grid-cols-2 gap-4"/g, 'className="quick-actions-grid"');

// Fix bad flex styles
content = content.replace(/flex: 1, display: 'flex'/g, 'display: \'flex\'');
content = content.replace(/style={{ flex: 1, background: 'rgba\(255,255,255,0.02\)'/g, 'style={{ background: \'rgba(255,255,255,0.02)\'');

// 1. Needs Attention Empty
content = content.replace(
  /<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>/g,
  '<div style={{ flex: 1, display: \'flex\', flexDirection: \'column\', alignItems: \'center\', justifyContent: \'center\', padding: \'40px 0\', maxHeight: \'280px\', margin: \'auto 0\' }}>'
);
// 2. Needs Attention List (FIRST occurrence of the gap: 16px div)
content = content.replace(
  /<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>/,
  '<div style={{ display: \'flex\', flexDirection: \'column\', gap: \'16px\', margin: \'auto 0\' }}>'
);

// 3. Upcoming Events Empty
content = content.replace(
  /<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>/g,
  '<div style={{ flex: 1, display: \'flex\', flexDirection: \'column\', alignItems: \'center\', justifyContent: \'center\', padding: \'20px 0\', maxHeight: \'280px\', margin: \'auto 0\' }}>'
);
// 4. Upcoming Events List (SECOND occurrence, since we replaced the first one)
content = content.replace(
  /<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>/,
  '<div style={{ display: \'flex\', flexDirection: \'column\', gap: \'16px\', overflowY: \'auto\', maxHeight: \'240px\', paddingRight: \'8px\', margin: \'auto 0\' }}>'
);

// 5. Attendance Empty
content = content.replace(
  /<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>/g,
  '<div style={{ flex: 1, display: \'flex\', flexDirection: \'column\', alignItems: \'center\', justifyContent: \'center\', padding: \'20px 0\', maxHeight: \'280px\', margin: \'auto 0\' }}>'
);

// 6. Activity Feed Empty
content = content.replace(
  /<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>/g,
  '<div style={{ flex: 1, display: \'flex\', flexDirection: \'column\', alignItems: \'center\', justifyContent: \'center\', maxHeight: \'280px\', margin: \'auto 0\' }}>'
);

// 7. Activity Feed List
content = content.replace(
  /<div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>/g,
  '<div style={{ display: \'flex\', flexDirection: \'column\', position: \'relative\', flex: 1, overflowY: \'auto\', maxHeight: \'350px\', paddingRight: \'8px\', margin: \'auto 0\' }}>'
);

// 8. Quick Actions wrapper
content = content.replace(
  /          <div className="quick-actions-grid">/,
  `          <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>\n            <div className="quick-actions-grid">`
);
content = content.replace(
  /            <\/button>\n          <\/div>\n\n          <button onClick={\(\) => navigate\('\/analytics'\)}/g,
  `            </button>\n            </div>\n\n          <button onClick={() => navigate('/analytics')}`
);
content = content.replace(
  /            <ChevronRight size={20} color="rgba\(255,255,255,0.5\)" \/>\n          <\/button>\n        <\/div>\n\n      <\/div>/,
  `            <ChevronRight size={20} color="rgba(255,255,255,0.5)" />\n          </button>\n          </div>\n        </div>\n\n      </div>`
);

fs.writeFileSync('client/src/pages/Dashboard.tsx', content);
console.log("Replacements complete.");
