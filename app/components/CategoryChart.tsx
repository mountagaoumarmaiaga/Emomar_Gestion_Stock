import { ChartData } from '@/type'
import React, { useEffect, useState, useCallback } from 'react'
import { getProductCategoryDistribution } from '../actions'
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Rectangle,
  BarChart,
  LabelList,
  Cell
} from 'recharts'
import EmptyState from './EmptyState'

const CategoryChart = ({ email }: { email: string }) => {
  const [data, setData] = useState<ChartData[]>([])

  const COLORS = {
    default: "#31F1F1",
    hover: "#FFB347",
    grid: "#e0e0e0"
  }

  const fetchStats = useCallback(async () => {
    try {
      if (email) {
        const data = await getProductCategoryDistribution(email)
        if (data) {
          setData(data)
        }
      }
    } catch (error) {
      console.error(error)
    }
  }, [email]) // email est la seule dépendance de fetchStats

  useEffect(() => {
    if (email) {
      fetchStats()
    }
  }, [email, fetchStats]) // Maintenant toutes les dépendances sont déclarées

  const renderChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        barCategoryGap="10%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 14, fill: "#333", fontWeight: 600 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#666" }}
        />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="value"
          fill={COLORS.default}
          activeBar={<Rectangle fill={COLORS.hover} stroke="#000" />}
          radius={[8, 8, 0, 0]}
          barSize={50}
        >
          <LabelList
            dataKey="value"
            position="top"
            style={{ fontSize: 14, fontWeight: 'bold', fill: "#444" }}
          />
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS.default} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )

  if (data.length === 0) {
    return (
      <div className='w-full border-2 border-base-200 mt-4 p-4 rounded-3xl'>
        <h2 className='text-xl font-bold mb-4'>
          5 catégories avec le plus de produits
        </h2>
        <EmptyState
          message='Aucune catégorie pour le moment'
          IconComponent='Group'
        />
      </div>
    )
  }

  return (
    <div className='w-full border-2 border-base-200 mt-4 p-4 rounded-3xl'>
      <h2 className='text-xl font-bold mb-4'>
        5 catégories avec le plus de produits
      </h2>
      {renderChart()}
    </div>
  )
}

export default CategoryChart