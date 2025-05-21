import { Transaction } from '@/type'
import React, { useEffect, useState, useCallback } from 'react'
import { getTransactions } from '../actions'
import EmptyState from './EmptyState'
import TransactionComponent from './TransactionComponent'

const RecentTransactions = ({ email }: { email: string }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([])

    // 1. On memoize la fonction fetchData avec useCallback
    const fetchData = useCallback(async () => {
        try {
            if (email) {
                const txs = await getTransactions(email, 10)
                if (txs) {
                    setTransactions(txs)
                }
            }
        } catch (error) {
            console.error(error)
        }
    }, [email]) // email est la seule dépendance

    // 2. On utilise useEffect avec toutes les dépendances nécessaires
    useEffect(() => {
        if (email) {
            fetchData()
        }
    }, [email, fetchData]) // On inclut fetchData dans les dépendances

    return (
        <div className='w-full border-2 border-base-200 mt-4 p-4 rounded-3xl'>
            {transactions.length === 0 ? (
                <EmptyState
                    message='Aucune Transaction pour le moment'
                    IconComponent='CaptionsOff'
                />
            ) : (
                <div className=''>
                    <h2 className='text-xl font-bold mb-4'>10 dernières transactions</h2>
                    <div className='space-y-4'>
                        {transactions.map((tx) => (
                            <TransactionComponent key={tx.id} tx={tx} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default RecentTransactions