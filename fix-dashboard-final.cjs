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

// Replace upcomingHolidays slicing
content = content.replace(
  /const upcomingHolidays = holidays\.filter\(h => new Date\(h\.date\) >= new Date\(\)\)\.slice\(0, 3\);/,
  `const allUpcomingHolidays = holidays.filter(h => new Date(h.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const upcomingHolidays = allUpcomingHolidays.slice(0, 3);`
);

// 3. Upcoming Events Complete Rewrite
const eventsRegex = /\{\/\* Upcoming Events \*\/\}[\s\S]*?(?=\s*\{\/\* ROW 3 \*\/)/;
const newEventsBlock = `{/* Upcoming Events */}
        <div style={{
          background: 'rgba(17,24,39,0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px',
          display: 'flex', flexDirection: 'column', maxHeight: '340px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <Calendar size={20} color="#8B5CF6" /> Upcoming Events
            </h3>
            {allUpcomingHolidays.length > 3 && (
              <span onClick={() => navigate('/holidays')} style={{ color: '#8B5CF6', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#A78BFA'} onMouseLeave={e => e.currentTarget.style.color = '#8B5CF6'}>
                View All
              </span>
            )}
          </div>
          {upcomingHolidays.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <CalendarDays size={28} color="#8B5CF6" opacity={0.8} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>No Upcoming Events</h4>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>No holidays configured.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingHolidays.map((holiday: any, idx: number) => {
                const date = new Date(holiday.date);
                return (
                  <div key={idx} style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', 
                    background: 'rgba(255,255,255,0.03)', padding: '14px', 
                    borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', 
                    transition: 'all 0.2s', cursor: 'default'
                  }} 
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)' }} 
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                    
                    {/* Date Badge: 60x60, rounded 16px, Month 11px, Day 24px */}
                    <div style={{ 
                      background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white', 
                      width: '60px', height: '60px', borderRadius: '16px', 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(139,92,246,0.3)', flexShrink: 0
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.9 }}>{date.toLocaleString('default', { month: 'short' })}</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1, marginTop: '2px' }}>{date.getDate()}</div>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '16px', color: '#fff', marginBottom: '2px' }}>{holiday.name}</div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{date.toLocaleDateString('default', { weekday: 'long' })}</div>
                    </div>

                    {/* Holiday Badge: Pill, Height 28px, Padding 8px 12px, font 12px, weight 500 */}
                    <div style={{
                      background: 'rgba(139, 92, 246, 0.15)', color: '#A78BFA',
                      padding: '0 12px', height: '28px', borderRadius: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap'
                    }}>
                      Holiday
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
`;
content = content.replace(eventsRegex, newEventsBlock);

// 4. Attendance Empty
content = content.replace(
  /<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>/g,
  '<div style={{ flex: 1, display: \'flex\', flexDirection: \'column\', alignItems: \'center\', justifyContent: \'center\', padding: \'20px 0\', maxHeight: \'280px\', margin: \'auto 0\' }}>'
);

// 5. Activity Feed Empty
content = content.replace(
  /<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>/g,
  '<div style={{ flex: 1, display: \'flex\', flexDirection: \'column\', alignItems: \'center\', justifyContent: \'center\', maxHeight: \'280px\', margin: \'auto 0\' }}>'
);

// 6. Activity Feed List
content = content.replace(
  /<div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>/g,
  '<div style={{ display: \'flex\', flexDirection: \'column\', position: \'relative\', flex: 1, overflowY: \'auto\', maxHeight: \'350px\', paddingRight: \'8px\', margin: \'auto 0\' }}>'
);

// 7. Quick Actions wrapper
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
console.log("All replacements applied successfully.");
