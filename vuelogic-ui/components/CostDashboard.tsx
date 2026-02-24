
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Activity, CBSNode } from '../types';

interface CostDashboardProps {
  activities: Activity[];
  cbs: CBSNode[];
}

const CostDashboard: React.FC<CostDashboardProps> = ({ activities, cbs }) => {
  const stats = React.useMemo(() => {
    let direct = 0;
    let indirect = 0;
    let hard = 0;
    let soft = 0;

    activities.forEach(a => {
      direct += a.directCost;
      indirect += a.indirectCost;
      if (a.isHardCost) hard += (a.directCost + a.indirectCost);
      else soft += (a.directCost + a.indirectCost);
    });

    return { direct, indirect, hard, soft, total: direct + indirect };
  }, [activities]);

  const pieData = [
    { name: 'Hard Costs', value: stats.hard, color: '#3b82f6' },
    { name: 'Soft Costs', value: stats.soft, color: '#10b981' },
  ];

  const typeData = [
    { name: 'Direct', value: stats.direct, color: '#6366f1' },
    { name: 'Indirect', value: stats.indirect, color: '#f59e0b' },
  ];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="space-y-8">
      {/* High Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Budget', value: stats.total, color: 'text-slate-900' },
          { label: 'Hard Costs', value: stats.hard, color: 'text-blue-600' },
          { label: 'Soft Costs', value: stats.soft, color: 'text-emerald-600' },
          { label: 'Indirect Costs', value: stats.indirect, color: 'text-amber-600' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{item.label}</div>
            <div className={`text-2xl font-bold ${item.color}`}>{formatCurrency(item.value)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cost Breakdown Visuals */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px]">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Hard vs Soft Cost Allocation</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px]">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Direct vs Indirect Breakdown</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={typeData}>
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CBS View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-sm">
          Total Cost Management (TCM) Framework CBS
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400">
              <th className="px-6 py-3 font-semibold">CBS Code</th>
              <th className="px-6 py-3 font-semibold">Classification</th>
              <th className="px-6 py-3 font-semibold">Total Assigned Cost</th>
              <th className="px-6 py-3 font-semibold">Activities Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cbs.map((node) => {
              const assigned = activities.filter(a => a.cbsCode === node.code);
              const totalCost = assigned.reduce((sum, a) => sum + a.directCost + a.indirectCost, 0);
              return (
                <tr key={node.code} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600">{node.code}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-700">{node.name}</div>
                    <div className="text-[10px] text-slate-400">{node.type}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">{formatCurrency(totalCost)}</td>
                  <td className="px-6 py-4 text-slate-500">{assigned.length} items</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CostDashboard;
