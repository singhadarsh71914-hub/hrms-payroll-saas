import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ComplianceRuleCard } from '../../components/compliance/ComplianceRuleCard';
import { RuleHistoryDrawer } from '../../components/compliance/RuleHistoryDrawer';
import { RuleEditModal } from '../../components/compliance/RuleEditModal';
import { RuleDiffViewer } from '../../components/compliance/RuleDiffViewer';
import { ShieldAlert, PlusCircle } from 'lucide-react';

interface ComplianceRule {
  id: string;
  state_code: string;
  rule_type: string;
  financial_year: number;
  configuration: any;
  is_active: boolean;
  version: number;
  effective_from: string;
  effective_to: string;
}

export default function StatutoryConfig() {
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [financialYear, setFinancialYear] = useState('2026');

  // Modals/Drawers state
  const [historyRuleGroup, setHistoryRuleGroup] = useState<ComplianceRule[] | null>(null);
  const [editingRule, setEditingRule] = useState<ComplianceRule | null>(null);
  const [diffRules, setDiffRules] = useState<{v1: any, v2: any} | null>(null);

  useEffect(() => {
    fetchRules();
  }, [financialYear]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/compliance?financial_year=${financialYear}`);
      setRules(data.rules || []);
    } catch (error) {
      console.error('Failed to fetch rules', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (rule: ComplianceRule) => {
    try {
      const newEffectiveFrom = new Date(rule.effective_to);
      newEffectiveFrom.setDate(newEffectiveFrom.getDate() + 1);
      const newEffectiveTo = new Date('2099-12-31T23:59:59Z');
      
      await api.post('/compliance/rules', {
        state_code: rule.state_code,
        financial_year: rule.financial_year,
        rule_type: rule.rule_type,
        configuration: rule.configuration,
        effective_from: newEffectiveFrom.toISOString(),
        effective_to: newEffectiveTo.toISOString(),
      });
      fetchRules();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to duplicate rule. Overlapping period?');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await api.put(`/compliance/rules/${id}`, { is_active: false });
      fetchRules();
    } catch (err) {
      alert('Failed to archive rule.');
    }
  };

  const handleSaveRule = async (id: string, newConfig: any, fullRule?: any) => {
    if (id === 'new' && fullRule) {
      await api.post('/compliance/rules', {
        state_code: fullRule.state_code,
        financial_year: fullRule.financial_year,
        rule_type: fullRule.rule_type,
        configuration: newConfig,
        effective_from: fullRule.effective_from,
        effective_to: fullRule.effective_to,
      });
    } else {
      await api.put(`/compliance/rules/${id}`, { configuration: newConfig });
    }
    fetchRules();
  };

  const groupedRules = rules.reduce((acc, rule) => {
    const key = `${rule.state_code}-${rule.rule_type}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(rule);
    return acc;
  }, {} as Record<string, ComplianceRule[]>);

  const handleCreateRule = () => {
    setEditingRule({
      id: 'new',
      state_code: 'GLOBAL',
      rule_type: 'PT',
      financial_year: parseInt(financialYear),
      configuration: { slabs: [] },
      is_active: true,
      version: 1,
      effective_from: `${financialYear}-04-01T00:00:00Z`,
      effective_to: `${parseInt(financialYear) + 1}-03-31T23:59:59Z`,
    } as any);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="p-8 max-w-[1920px] mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <ShieldAlert className="text-blue-500" size={32} />
              Statutory Compliance
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-2xl">
              Manage PT, ESI, LWF, Gratuity, and Tax rules per state and financial year with immutable versioning.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-2">Financial Year</label>
            <select 
              value={financialYear} 
              onChange={(e) => setFinancialYear(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg py-2 px-4 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            >
              <option value="2024">2024-25</option>
              <option value="2025">2025-26</option>
              <option value="2026">2026-27</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-72 bg-slate-900 rounded-2xl animate-pulse border border-slate-800"></div>
            ))}
          </div>
        ) : rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 px-4 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20 text-center">
            <ShieldAlert size={64} className="text-slate-700 mb-6" />
            <h2 className="text-xl font-bold text-slate-300 mb-2">No statutory rules configured</h2>
            <p className="text-slate-500 mb-8 max-w-md">
              Create PT, ESI, LWF, Gratuity, or Tax rules for the financial year {financialYear}-{(parseInt(financialYear) + 1).toString().slice(2)}.
            </p>
            <button onClick={handleCreateRule} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <PlusCircle size={20} />
              Create Rule
            </button>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(groupedRules).map(([key, group]) => {
              const latestRule = group[0]; // Descending by version
              return (
                <ComplianceRuleCard 
                  key={key} 
                  rule={latestRule} 
                  onDuplicate={handleDuplicate}
                  onArchive={handleArchive}
                  onEdit={setEditingRule}
                  onHistoryToggle={() => setHistoryRuleGroup(group)}
                />
              );
            })}
          </div>
        )}

      </div>

      <RuleHistoryDrawer 
        history={historyRuleGroup || []}
        isOpen={!!historyRuleGroup}
        onClose={() => setHistoryRuleGroup(null)}
        onCompare={(v1, v2) => setDiffRules({ v1, v2 })}
      />

      <RuleEditModal
        isOpen={!!editingRule}
        rule={editingRule}
        onClose={() => setEditingRule(null)}
        onSave={handleSaveRule}
      />

      <RuleDiffViewer
        v1={diffRules?.v1}
        v2={diffRules?.v2}
        isOpen={!!diffRules}
        onClose={() => setDiffRules(null)}
      />

    </div>
  );
}
