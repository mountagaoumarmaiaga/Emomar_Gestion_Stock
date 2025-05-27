import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const email = searchParams.get('email')

        if (!email) {
            return NextResponse.json(
                { error: "Email requis" },
                { status: 400 }
            )
        }

        const destinations = await prisma.destination.findMany({
            where: { entreprise: { email } },
            orderBy: { name: 'asc' },
            include: { 
                _count: { select: { transactions: true } } 
            }
        })

        return NextResponse.json(
            destinations.map(d => ({
                ...d,
                transactionCount: d._count.transactions
            }))
        )
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const { name, description, email } = await request.json()

        if (!name || !email) {
            return NextResponse.json(
                { error: "Nom et email requis" },
                { status: 400 }
            )
        }

        const entreprise = await prisma.entreprise.findUnique({
            where: { email }
        })

        if (!entreprise) {
            return NextResponse.json(
                { error: "Entreprise non trouvée" },
                { status: 404 }
            )
        }

        const newDestination = await prisma.destination.create({
            data: {
                name,
                description: description || null,
                entrepriseId: entreprise.id
            },
            include: {
                _count: { select: { transactions: true } }
            }
        })

        return NextResponse.json({
            ...newDestination,
            transactionCount: newDestination._count.transactions
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        )
    }
}