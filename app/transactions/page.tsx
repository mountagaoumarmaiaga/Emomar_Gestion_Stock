"use client"

import { Product, Transaction } from '@/type'
import { useUser } from '@clerk/nextjs'
import React, { useEffect, useState, useCallback } from 'react'
import Wrapper from '../components/Wrapper'
import { getTransactions, readProducts } from '../actions'
import EmptyState from '../components/EmptyState'
import TransactionComponent from '../components/TransactionComponent'
import { RotateCcw } from 'lucide-react'

const ITEMS_PER_PAGE = 5

const TransactionsPage = () => {
    const { user } = useUser()
    const email = user?.primaryEmailAddress?.emailAddress as string
    const [products, setProducts] = useState<Product[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [dateFrom, setDateFrom] = useState<string>("")
    const [dateTo, setDateTo] = useState<string>("")
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [isLoading, setIsLoading] = useState(false)

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        try {
            if (email) {
                const [productsResult, transactionsData] = await Promise.all([
                    readProducts(email, { limit: 100, offset: 0 }), // ✅ on prend la liste paginée
                    getTransactions(email)
                ])
                if (productsResult && productsResult.products) {
                    setProducts(productsResult.products) // ✅ on met juste le tableau
                }
                if (transactionsData) setTransactions(transactionsData)
            }
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setIsLoading(false)
        }
    }, [email])

    useEffect(() => {
        if (email) fetchData()
    }, [email, fetchData])

    useEffect(() => {
        let filtered = transactions

        if (selectedProduct) {
            filtered = filtered.filter(tx => tx.productId === selectedProduct.id)
        }
        if (dateFrom) {
            filtered = filtered.filter(tx => new Date(tx.createdAt) >= new Date(dateFrom))
        }
        if (dateTo) {
            filtered = filtered.filter(tx => new Date(tx.createdAt) <= new Date(dateTo))
        }

        setFilteredTransactions(filtered)
        setCurrentPage(1)
    }, [selectedProduct, dateFrom, dateTo, transactions])

    const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const currentTransactions = filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    const resetFilters = () => {
        setSelectedProduct(null)
        setDateFrom("")
        setDateTo("")
    }

    return (
        <Wrapper>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <h1 className="text-2xl font-bold">Historique des Transactions</h1>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={fetchData}
                            className="btn btn-outline"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Chargement...' : 'Rafraîchir'}
                        </button>
                    </div>
                </div>

                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="label">
                                    <span className="label-text">Filtrer par produit</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={selectedProduct?.id || ""}
                                    onChange={(e) => {
                                        const product = products.find(p => p.id === e.target.value) || null
                                        setSelectedProduct(product)
                                    }}
                                    disabled={isLoading}
                                >
                                    <option value="">Tous les produits</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex-1">
                                <label className="label">
                                    <span className="label-text">Période</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Date de début"
                                        className="input input-bordered flex-1"
                                        value={dateFrom}
                                        onFocus={(e) => e.target.type = "date"}
                                        onBlur={(e) => !e.target.value && (e.target.type = "text")}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        disabled={isLoading}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Date de fin"
                                        className="input input-bordered flex-1"
                                        value={dateTo}
                                        onFocus={(e) => e.target.type = "date"}
                                        onBlur={(e) => !e.target.value && (e.target.type = "text")}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        disabled={isLoading}
                                    />
                                    <button
                                        className="btn btn-outline"
                                        onClick={resetFilters}
                                        disabled={isLoading}
                                    >
                                        <RotateCcw size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <EmptyState
                        message={transactions.length === 0 
                            ? "Aucune transaction trouvée" 
                            : "Aucune transaction ne correspond aux filtres"}
                        IconComponent="ListTodo"
                    />
                ) : (
                    <div className="space-y-4">
                        {currentTransactions.map((tx) => (
                            <TransactionComponent key={tx.id} tx={tx} />
                        ))}

                        {totalPages > 1 && (
                            <div className="flex justify-center mt-6">
                                <div className="join">
                                    <button
                                        className="join-item btn"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1 || isLoading}
                                    >
                                        «
                                    </button>
                                    <button className="join-item btn">
                                        Page {currentPage} sur {totalPages}
                                    </button>
                                    <button
                                        className="join-item btn"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages || isLoading}
                                    >
                                        »
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Wrapper>
    )
}

export default TransactionsPage
