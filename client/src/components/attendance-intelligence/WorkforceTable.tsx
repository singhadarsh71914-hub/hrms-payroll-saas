import React, { useState, useMemo } from 'react';
import { 
  createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, 
  getFilteredRowModel, getPaginationRowModel, useReactTable 
} from '@tanstack/react-table';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface EmployeeRecord {
  id: string;
  name: string;
  department: string;
  status: 'ACTIVE' | 'REMOTE' | 'ON LEAVE' | 'LATE' | 'OFFLINE';
  location: string;
  trustScore: number;
  checkIn: string;
  lastActivity: string;
}

// Removed mockData

const columnHelper = createColumnHelper<EmployeeRecord>();

const WorkforceTable = React.memo(function WorkforceTable({ employees }: { employees: EmployeeRecord[] }) {
  const { isDark } = useTheme();
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Employee',
      cell: info => <span style={{ fontWeight: 600 }}>{info.getValue()}</span>,
    }),
    columnHelper.accessor('department', {
      header: 'Department',
      cell: info => <span style={{ color: 'var(--text-muted)' }}>{info.getValue()}</span>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const val = info.getValue();
        let color = '#6b7280', bg = 'rgba(107, 114, 128, 0.1)';
        if (val === 'ACTIVE') { color = '#10b981'; bg = 'rgba(16, 185, 129, 0.1)'; }
        if (val === 'REMOTE') { color = '#8b5cf6'; bg = 'rgba(139, 92, 246, 0.1)'; }
        if (val === 'LATE') { color = '#f59e0b'; bg = 'rgba(245, 158, 11, 0.1)'; }
        if (val === 'ON LEAVE') { color = '#ec4899'; bg = 'rgba(236, 72, 153, 0.1)'; }
        return (
          <span style={{ color, background: bg, padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
            {val}
          </span>
        );
      },
    }),
    columnHelper.accessor('location', {
      header: 'Location',
    }),
    columnHelper.accessor('trustScore', {
      header: 'Trust Score',
      cell: info => {
        const score = info.getValue();
        const color = score > 90 ? '#10b981' : score > 75 ? '#f59e0b' : '#ef4444';
        return <span style={{ color, fontWeight: 700 }}>{score}%</span>;
      },
    }),
    columnHelper.accessor('checkIn', {
      header: 'Check-In',
    }),
    columnHelper.accessor('lastActivity', {
      header: 'Last Activity',
      cell: info => <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{info.getValue()}</span>,
    }),
  ], []);

  const table = useReactTable({
    data: employees || [],
    columns: columns || [],
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } }
  });

  return (
    <div className="premium-card" style={{ 
      display: 'flex', flexDirection: 'column', 
      background: isDark ? 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', 
      backdropFilter: 'blur(10px)', 
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', 
      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)', padding: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Workforce Visibility</h3>
        
        <div style={{ position: 'relative', width: '250px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search employees..." 
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            style={{ 
              width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              background: isDark ? 'rgba(0,0,0,0.2)' : '#fff',
              color: 'var(--text-color)', outline: 'none'
            }} 
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', borderRadius: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} style={{ background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} onClick={header.column.getToggleSortingHandler()} style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: <ChevronUp size={14} />,
                        desc: <ChevronDown size={14} />
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} style={{ padding: '16px', fontSize: '14px', color: 'var(--text-color)' }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
        <div>
          Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} entries
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => table.previousPage()} 
            disabled={!table.getCanPreviousPage()}
            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: 'var(--text-color)', cursor: table.getCanPreviousPage() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center' }}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <button 
            onClick={() => table.nextPage()} 
            disabled={!table.getCanNextPage()}
            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: 'var(--text-color)', cursor: table.getCanNextPage() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center' }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
});

export default WorkforceTable;
