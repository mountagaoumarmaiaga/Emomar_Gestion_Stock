import { StockSummary } from '@/type'
import React, { useEffect, useState, useCallback } from 'react'
import { getStockSummary } from '../actions'
import ProductImage from './ProductImage'
import EmptyState from './EmptyState'
import { AlertCircle } from 'lucide-react'

const StockSummaryTable = ({ email }: { email: string }) => {
    const [data, setData] = useState<StockSummary | null>(null)
    const [loading, setLoading] = useState(true)

    // Utilisation de useCallback pour mémoriser la fonction
    const fetchSummary = useCallback(async () => {
        try {
            setLoading(true)
            if (email) {
                const summaryData = await getStockSummary(email)
                setData(summaryData)
            }
        } catch (error) {
            console.error("Erreur lors de la récupération du stock:", error)
        } finally {
            setLoading(false)
        }
    }, [email]) // email est maintenant une dépendance

    useEffect(() => {
        if (email) fetchSummary()
    }, [email, fetchSummary]) // Ajout de fetchSummary comme dépendance

    if (loading) return (
        <div className='flex justify-center items-center w-full h-64'>
            <span className="loading loading-spinner loading-lg"></span>
        </div>
    )

    if (!data) return (
        <EmptyState
            message='Aucun produit disponible'
            IconComponent='PackageSearch'
        />
    )

    return (
        <div className='w-full'>
            {/* Ancien design des étapes */}
            <ul className="steps steps-vertical lg:steps-horizontal border-2 border-base-200 w-full p-4 rounded-3xl">
                <li className="step step-primary">
                    <div className='flex items-center gap-2'>
                        <span className='text-sm font-bold'>Stock normal</span>
                        <span className='badge badge-success'>{data.inStockCount}</span>
                    </div>
                </li>
                <li className="step step-primary">
                    <div className='flex items-center gap-2'>
                        <span className='text-sm font-bold'>Stock faible (≤ 20)</span>
                        <span className='badge badge-warning'>{data.lowStockCount}</span>
                    </div>
                </li>
                <li className="step step-primary">
                    <div className='flex items-center gap-2'>
                        <span className='text-sm font-bold'>Rupture</span>
                        <span className='badge badge-error'>{data.outOfStockCount}</span>
                    </div>
                </li>
            </ul>

            {/* Section des produits critiques */}
            <div className='border-2 border-base-200 w-full p-4 rounded-3xl mt-4'>
                <h2 className='text-xl font-bold mb-4 flex items-center gap-2'>
                    <AlertCircle className='text-error' size={20} />
                    Produits critiques
                </h2>
                
                {data.criticalProducts.length > 0 ? (
                    <div className='overflow-x-auto'>
                        <table className='table'>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Image</th>
                                    <th>Nom</th>
                                    <th>Quantité</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.criticalProducts.map((product, index) => (
                                    <tr key={product.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <ProductImage
                                                src={product.imageUrl || ''}
                                                alt={product.name}
                                                heightClass='h-12'
                                                widthClass='w-12'
                                            />
                                        </td>
                                        <td className='font-medium'>{product.name}</td>
                                        <td className={product.quantity === 0 ? 'text-error' : 'text-warning'}>
                                            {product.quantity}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        message='Aucun produit disponible'
                        IconComponent='PackageSearch'
                    />
                )}
            </div>
        </div>
    )
}

export default StockSummaryTable