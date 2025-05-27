"use client"

import { Transaction } from '@/type'
import React from 'react'
import ProductImage from './ProductImage'
import { ArrowRight, ArrowLeft } from 'lucide-react'

const TransactionComponent = ({ tx }: { tx: Transaction }) => {
    const formattedDate = new Date(tx.createdAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    })

    return (
        <div className='p-4 border-2 border-base-200 rounded-3xl flex items-center w-full hover:bg-base-100 transition-colors'>
            <div className="flex-shrink-0">
                {tx.imageUrl ? (
                    <ProductImage
                        src={tx.imageUrl}
                        alt={tx.productName}
                        heightClass='h-12'
                        widthClass='w-12'
                    />
                ) : (
                    <div className='h-12 w-12 rounded-lg bg-base-200 flex items-center justify-center'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                    </div>
                )}
            </div>
            
            <div className='ml-4 flex-1'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
                    <div>
                        <h3 className='font-semibold text-base'>{tx.productName}</h3>
                        <div className='flex flex-wrap gap-2 mt-2 items-center'>
                            <span className='badge badge-outline'>{tx.categoryName}</span>
                            {tx.destination && (
                                <div className="tooltip" data-tip={tx.destination.description || ''}>
                                    <span className={`badge ${tx.type === 'OUT' ? 'badge-primary' : 'badge-secondary'} flex items-center gap-1`}>
                                        {tx.type === 'OUT' ? (
                                            <>
                                                <ArrowRight size={14} />
                                                {tx.destination.name}
                                            </>
                                        ) : (
                                            <>
                                                <ArrowLeft size={14} />
                                                {tx.destination.name}
                                            </>
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className='text-right'>
                        <span className={`font-bold text-lg ${tx.type === 'IN' ? 'text-success' : 'text-error'}`}>
                            {tx.type === 'IN' ? '+' : '-'}{tx.quantity} {tx.unit}
                        </span>
                        <div className='text-sm text-gray-500 mt-1'>
                            {formattedDate}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TransactionComponent