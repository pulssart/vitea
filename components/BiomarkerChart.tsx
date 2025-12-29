'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import { Biomarker } from '@/lib/store'

interface BiomarkerChartProps {
  biomarkers: Biomarker[]
}

export default function BiomarkerChart({ biomarkers }: BiomarkerChartProps) {
  const statusData = useMemo(() => {
    const counts = {
      optimal: biomarkers.filter((b) => b.status === 'optimal').length,
      standard: biomarkers.filter((b) => b.status === 'standard').length,
      attention: biomarkers.filter((b) => b.status === 'attention').length,
    }
    return [
      { name: 'Optimal', value: counts.optimal, color: '#1e5631' },
      { name: 'Standard', value: counts.standard, color: '#2563eb' },
      { name: 'À surveiller', value: counts.attention, color: '#dc2626' },
    ]
  }, [biomarkers])

  const categoryData = useMemo(() => {
    const categories: Record<string, { optimal: number; standard: number; attention: number }> = {}
    
    biomarkers.forEach((b) => {
      if (!categories[b.category]) {
        categories[b.category] = { optimal: 0, standard: 0, attention: 0 }
      }
      categories[b.category][b.status]++
    })
    
    return Object.entries(categories).map(([name, data]) => ({
      name: name.length > 12 ? name.slice(0, 12) + '...' : name,
      fullName: name,
      ...data,
      total: data.optimal + data.standard + data.attention,
    }))
  }, [biomarkers])

  const attentionItems = useMemo(() => {
    return biomarkers
      .filter((b) => b.status === 'attention')
      .slice(0, 6)
      .map((b) => {
        const range = b.normalRange.max - b.normalRange.min
        const deviation = b.value < b.normalRange.min
          ? ((b.normalRange.min - b.value) / range) * 100
          : ((b.value - b.normalRange.max) / range) * 100
        return {
          name: b.name.length > 18 ? b.name.slice(0, 18) + '...' : b.name,
          fullName: b.name,
          deviation: Math.min(deviation, 100),
          value: b.value,
          unit: b.unit,
          low: b.value < b.normalRange.min,
        }
      })
  }, [biomarkers])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface p-3 rounded-lg border border-border shadow-medium text-sm">
          <p className="font-medium text-text-primary mb-1">{payload[0]?.payload?.fullName || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-4">Répartition des statuts</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-text-secondary">{item.name}</span>
                <span className="font-medium text-text-primary">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-4">Par catégorie</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#999', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#666', fontSize: 11 }}
                  width={90}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="optimal" name="Optimal" stackId="a" fill="#1e5631" radius={[0, 0, 0, 0]} />
                <Bar dataKey="standard" name="Standard" stackId="a" fill="#2563eb" />
                <Bar dataKey="attention" name="À surveiller" stackId="a" fill="#dc2626" radius={[0, 4, 4, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Attention Items */}
      {attentionItems.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-4">Biomarqueurs à surveiller</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={attentionItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#999', fontSize: 11 }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#666', fontSize: 11 }}
                  width={110}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-surface p-3 rounded-lg border border-border shadow-medium text-sm">
                          <p className="font-medium text-text-primary">{data.fullName}</p>
                          <p className="text-text-secondary">
                            {data.value} {data.unit} ({data.low ? 'Bas' : 'Élevé'})
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="deviation" name="Écart %" fill="#dc2626" radius={[0, 4, 4, 0]}>
                  {attentionItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.low ? '#dc2626' : '#d97706'} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-status-attention" />
              <span className="text-text-muted">Valeur basse</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-status-warning" />
              <span className="text-text-muted">Valeur élevée</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
