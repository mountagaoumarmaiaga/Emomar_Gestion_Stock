"use server"

import prisma from "@/lib/prisma"
import { FormDataType, OrderItem, Product, ProductOverviewStats, StockSummary, Transaction } from "@/type"
import { Category, Prisma } from "@prisma/client"

// Fonction entreprise (avec nom corrigé)
export async function checkAndAddentreprise(email: string, name: string) {
    if (!email) return
    try {
        const existingEntreprise = await prisma.entreprise.findUnique({
            where: { email }
        })
        if (!existingEntreprise && name) {
            await prisma.entreprise.create({
                data: { email, name }
            })
        }
    } catch (error) {
        console.error("Erreur création entreprise:", error)
        throw error
    }
}

export async function getEntreprise(email: string) {
    if (!email) return null
    try {
        return await prisma.entreprise.findUnique({
            where: { email }
        })
    } catch (error) {
        console.error("Erreur récupération entreprise:", error)
        throw error
    }
}

// Fonctions pour les catégories
export async function createCategory(name: string, email: string, description?: string) {
    try {
        const entreprise = await getEntreprise(email)
        if (!entreprise) throw new Error("Entreprise non trouvée")

        return await prisma.category.create({
            data: {
                name,
                description: description || "",
                entrepriseId: entreprise.id
            }
        })
    } catch (error) {
        console.error("Erreur création catégorie:", error)
        throw error
    }
}

export async function updateCategory(id: string, email: string, name: string, description?: string) {
    try {
        const entreprise = await getEntreprise(email)
        if (!entreprise) throw new Error("Entreprise non trouvée")

        return await prisma.category.update({
            where: { id, entrepriseId: entreprise.id },
            data: { name, description: description || "" }
        })
    } catch (error) {
        console.error("Erreur mise à jour catégorie:", error)
        throw error
    }
}

export async function deleteCategory(id: string, email: string) {
    try {
        const entreprise = await getEntreprise(email)
        if (!entreprise) throw new Error("Entreprise non trouvée")

        return await prisma.category.delete({
            where: { id, entrepriseId: entreprise.id }
        })
    } catch (error) {
        console.error("Erreur suppression catégorie:", error)
        throw error
    }
}

export async function readCategories(email: string): Promise<Category[]> {
    try {
        const entreprise = await getEntreprise(email)
        if (!entreprise) throw new Error("Entreprise non trouvée")

        return await prisma.category.findMany({
            where: { entrepriseId: entreprise.id },
            orderBy: { name: 'asc' }
        })
    } catch (error) {
        console.error("Erreur lecture catégories:", error)
        throw error
    }
}

// Fonctions pour les produits (avec price optionnel)
export async function createProduct(formData: FormDataType, email: string) {
    try {
        const { name, description, imageUrl, categoryId, unit } = formData
        if (!name || !categoryId) throw new Error("Nom et catégorie requis")

        const entreprise = await getEntreprise(email)
        if (!entreprise) throw new Error("Entreprise non trouvée")

        return await prisma.product.create({
            data: {
                name,
                description,
                imageUrl: imageUrl || "",
                categoryId,
                unit: unit || "",
                entrepriseId: entreprise.id,
                price: 0 // Valeur par défaut temporaire
            }
        })
    } catch (error) {
        console.error("Erreur création produit:", error)
        throw error
    }
}

export async function updateProduct(formData: FormDataType, email: string) {
    try {
        const { id, name, description, imageUrl } = formData
        if (!id || !name) throw new Error("ID et nom requis")

        const entreprise = await getEntreprise(email)
        if (!entreprise) throw new Error("Entreprise non trouvée")

        return await prisma.product.update({
            where: { id, entrepriseId: entreprise.id },
            data: { 
                name,
                description,
                imageUrl
            }
        })
    } catch (error) {
        console.error("Erreur mise à jour produit:", error)
        throw error
    }
}

export async function deleteProduct(id: string, email: string) {
    try {
        const entreprise = await getEntreprise(email)
        if (!entreprise) throw new Error("Entreprise non trouvée")

        return await prisma.product.delete({
            where: { id, entrepriseId: entreprise.id }
        })
    } catch (error) {
        console.error("Erreur suppression produit:", error)
        throw error
    }
}

export async function readProducts(
    email: string,
    filters?: {
        searchName?: string
        categoryId?: string
    }
): Promise<Product[]> {
    try {
        const entreprise = await getEntreprise(email)
        if (!entreprise) throw new Error("Entreprise non trouvée")

        const where: Prisma.ProductWhereInput = {
            entrepriseId: entreprise.id,
            AND: [
                filters?.searchName ? { 
                    name: { contains: filters.searchName, mode: 'insensitive' } 
                } : {},
                filters?.categoryId ? { 
                    categoryId: filters.categoryId 
                } : {}
            ]
        }

        const products = await prisma.product.findMany({
            where,
            include: { category: true },
            orderBy: { name: 'asc' }
        })

        return products.map(product => ({
            ...product,
            categoryName: product.category?.name || 'Non catégorisé'
        }))
    } catch (error) {
        console.error("Erreur lecture produits:", error)
        throw error
    }
}

export async function readProductById(productId: string, email: string): Promise<Product | null> {
    try {
        const entreprise = await getEntreprise(email)
        if (!entreprise) throw new Error("Entreprise non trouvée")

        const product = await prisma.product.findUnique({
            where: { id: productId, entrepriseId: entreprise.id },
            include: { category: true }
        })

        return product ? {
            ...product,
            categoryName: product.category?.name
        } : null
    } catch (error) {
        console.error("Erreur lecture produit:", error)
        throw error
    }
}

// Fonctions pour les transactions
export async function replenishStockWithTransaction(productId: string, quantity: number, email: string) {
    try {
        const entreprise = await getEntreprise(email)
        if (!entreprise) throw new Error("Entreprise non trouvée")

        return await prisma.$transaction([
            prisma.product.update({
                where: { id: productId, entrepriseId: entreprise.id },
                data: { quantity: { increment: quantity } }
            }),
            prisma.transaction.create({
                data: {
                    type: "IN",
                    quantity,
                    productId,
                    entrepriseId: entreprise.id
                }
            })
        ])
    } catch (error) {
        console.error("Erreur réapprovisionnement:", error)
        throw error
    }
}

export async function deductStockWithTransaction(
    orderItems: OrderItem[], 
    email: string,
    destinationId?: string
) {
    try {
        const entreprise = await getEntreprise(email)
        if (!entreprise) throw new Error("Entreprise non trouvée")

        return await prisma.$transaction(async (tx) => {
            for (const item of orderItems) {
                await tx.product.update({
                    where: { id: item.productId, entrepriseId: entreprise.id },
                    data: { quantity: { decrement: item.quantity } }
                })

                await tx.transaction.create({
                    data: {
                        type: "OUT",
                        quantity: item.quantity,
                        productId: item.productId,
                        entrepriseId: entreprise.id,
                        ...(destinationId && { destinationId })
                    }
                })
            }
            return { success: true }
        })
    } catch (error) {
        console.error("Erreur déduction stock:", error)
        return { 
            success: false, 
            message: error instanceof Error ? error.message : "Erreur inconnue" 
        }
    }
}

export async function getTransactions(
    email: string, 
    options?: {
        limit?: number
        filters?: {
            productId?: string
            dateFrom?: Date
            dateTo?: Date
            type?: 'IN' | 'OUT'
        }
    }
): Promise<Transaction[]> {
    try {
        const entreprise = await getEntreprise(email)
        if (!entreprise) throw new Error("Entreprise non trouvée")

        const where: Prisma.TransactionWhereInput = {
            entrepriseId: entreprise.id,
            AND: [
                options?.filters?.productId ? { productId: options.filters.productId } : {},
                options?.filters?.dateFrom ? { createdAt: { gte: options.filters.dateFrom } } : {},
                options?.filters?.dateTo ? { createdAt: { lte: options.filters.dateTo } } : {},
                options?.filters?.type ? { type: options.filters.type } : {}
            ]
        }

        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: options?.limit,
            include: {
                product: { 
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        unit: true,
                        category: { select: { name: true } }
                    }
                },
                destination: true
            }
        })

        return transactions.map(tx => ({
            id: tx.id,
            type: tx.type as 'IN' | 'OUT',
            quantity: tx.quantity,
            productId: tx.productId,
            entrepriseId: tx.entrepriseId,
            destinationId: tx.destinationId,
            createdAt: tx.createdAt,
            categoryName: tx.product.category.name,
            productName: tx.product.name,
            imageUrl: tx.product.imageUrl,
            unit: tx.product.unit,
            destination: tx.destination ? {
                id: tx.destination.id,
                name: tx.destination.name,
                description: tx.destination.description,
                entrepriseId: tx.destination.entrepriseId
            } : undefined
        }))
    } catch (error) {
        console.error("Erreur récupération transactions:", error)
        throw error
    }
}

// Fonctions pour les statistiques
export async function getProductOverviewStats(email: string): Promise<ProductOverviewStats> {
    try {
        const entreprise = await getEntreprise(email)
        if (!entreprise) throw new Error("Entreprise non trouvée")

        const [totalProducts, totalCategories, totalTransactions] = await Promise.all([
            prisma.product.count({ where: { entrepriseId: entreprise.id } }),
            prisma.category.count({ where: { entrepriseId: entreprise.id } }),
            prisma.transaction.count({ where: { entrepriseId: entreprise.id } })
        ])

        return {
            totalProducts,
            totalCategories,
            totalTransactions
        }
    } catch (error) {
        console.error("Erreur stats overview:", error)
        return {
            totalProducts: 0,
            totalCategories: 0,
            totalTransactions: 0
        }
    }
}

export async function getProductCategoryDistribution(email: string) {
    try {
        const entreprise = await getEntreprise(email)
        if (!entreprise) throw new Error("Entreprise non trouvée")

        const categories = await prisma.category.findMany({
            where: { entrepriseId: entreprise.id },
            include: { _count: { select: { products: true } } },
            orderBy: { name: 'asc' }
        })

        return categories.map(category => ({
            name: category.name,
            value: category._count.products
        }))
    } catch (error) {
        console.error("Erreur distribution catégories:", error)
        throw error
    }
}

export async function getStockSummary(email: string): Promise<StockSummary> {
    try {
        const entreprise = await getEntreprise(email)
        if (!entreprise) throw new Error("Entreprise non trouvée")

        const products = await prisma.product.findMany({
            where: { entrepriseId: entreprise.id },
            include: { category: true }
        })

        const IN_STOCK_MIN = 20
        const inStock = products.filter(p => p.quantity > IN_STOCK_MIN)
        const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= IN_STOCK_MIN)
        const outOfStock = products.filter(p => p.quantity === 0)

        return {
            inStockCount: inStock.length,
            lowStockCount: lowStock.length,
            outOfStockCount: outOfStock.length,
            criticalProducts: [...lowStock, ...outOfStock].map(p => ({
                id: p.id,
                name: p.name,
                quantity: p.quantity,
                categoryName: p.category?.name || "Non catégorisé",
                imageUrl: p.imageUrl
            }))
        }
    } catch (error) {
        console.error("Erreur summary stock:", error)
        return {
            inStockCount: 0,
            lowStockCount: 0,
            outOfStockCount: 0,
            criticalProducts: []
        }
    }
}