"use server"

import prisma from "@/lib/prisma"
import { FormDataType, OrderItem, Product, ProductOverviewStats, StockSummary, Transaction } from "@/type"
import { Category, Prisma} from "@prisma/client"


export async function checkAndAddentreprise(email: string, name: string) {
    if (!email) return
    try {
        const existingentreprise = await prisma.entreprise.findUnique({
            where: {
                email
            }
        })
        if (!existingentreprise && name) {
            await prisma.entreprise.create({
                data: {
                    email, name
                }
            })
        }

    } catch (error) {
        console.error(error)
    }
}

export async function getEntreprise(email: string) {
    if (!email) return
    try {
        const existingEntreprise = await prisma.entreprise.findUnique({
            where: {
                email
            }
        })
        return existingEntreprise
    } catch (error) {
        console.error(error)
    }
}

export async function createCategory(
    name: string,
    email: string,
    description?: string
) {

    if (!name) return
    try {

        const entreprise = await getEntreprise(email)
        if (!entreprise) {
            throw new Error("Aucune entreprise trouvée avec cet email.");
        }
        await prisma.category.create({
            data: {
                name,
                description: description || "",
                entrepriseId: entreprise.id
            }
        })

    } catch (error) {
        console.error(error)
    }
}

export async function updateCategory(
    id: string,
    email: string,
    name: string,
    description?: string,
) {

    if (!id || !email || !name) {
        throw new Error("L'id, l'email de l'entreprise et le nom de la catégorie sont requis pour la mise à jour.")
    }

    try {
        const entreprise = await getEntreprise(email)
        if (!entreprise) {
            throw new Error("Aucune entreprise trouvée avec cet email.");
        }

        await prisma.category.update({
            where: {
                id: id,
                entrepriseId: entreprise.id
            },
            data: {
                name,
                description: description || "",
            }
        })

    } catch (error) {
        console.error(error)
    }
}

export async function deleteCategory(id: string, email: string) {
    if (!id || !email) {
        throw new Error("L'id, l'email de l'entreprise et sont requis.")
    }

    try {
        const entreprise = await getEntreprise(email)
        if (!entreprise) {
            throw new Error("Aucune entreprise trouvée avec cet email.");
        }

        await prisma.category.delete({
            where: {
                id: id,
                entrepriseId: entreprise.id
            }
        })
    } catch (error) {
        console.error(error)
    }
}

export async function readCategories(email: string): Promise<Category[] | undefined> {
    if (!email) {
        throw new Error("l'email de l'entreprise est  requis")
    }

    try {
        const entreprise = await getEntreprise(email)
        if (!entreprise) {
            throw new Error("Aucune entreprise trouvée avec cet email.");
        }

        const categories = await prisma.category.findMany({
            where: {
                entrepriseId: entreprise.id
            }
        })
        return categories
    } catch (error) {
        console.error(error)
    }
}

export async function createProduct(formData: FormDataType, email: string) {
    try {
        const { name, description, price, imageUrl, categoryId, unit } = formData;
        if (!email || !price || !categoryId || !email) {
            throw new Error("Le nom, le prix, la catégorie et l'email de l'entreprise sont requis pour la création du produit.")
        }
        const safeImageUrl = imageUrl || ""
        const safeUnit = unit || ""

        const entreprise = await getEntreprise(email)
        if (!entreprise) {
            throw new Error("Aucune entreprise trouvée avec cet email.");
        }

        await prisma.product.create({
            data: {
                name,
                description,
                price: Number(price),
                imageUrl: safeImageUrl,
                categoryId,
                unit: safeUnit,
                entrepriseId: entreprise.id
            }
        })

    } catch (error) {
        console.error(error)
    }
}

export async function updateProduct(formData: FormDataType, email: string) {
    try {
        const { id, name, description, price, imageUrl } = formData;
        if (!email || !price || !id || !email) {
            throw new Error("L'id, le nom, le prix et l'email sont requis pour la mise à jour du produit.")
        }

        const entreprise = await getEntreprise(email)
        if (!entreprise) {
            throw new Error("Aucune entreprise trouvée avec cet email.");
        }

        await prisma.product.update({
            where: {
                id: id,
                entrepriseId: entreprise.id
            },
            data: {
                name,
                description,
                price: Number(price),
                imageUrl: imageUrl,
            }
        })

    } catch (error) {
        console.error(error)
    }
}

export async function deleteProduct(id: string, email: string) {
    try {
        if (!id) {
            throw new Error("L'id est  requis pour la suppression.")
        }

        const entreprise = await getEntreprise(email)
        if (!entreprise) {
            throw new Error("Aucune entreprise trouvée avec cet email.");
        }

        await prisma.product.delete({
            where: {
                id: id,
                entrepriseId: entreprise.id
            }
        })
    } catch (error) {
        console.error(error)
    }
}

export async function readProducts(
    email: string,
    filters?: {
        searchName?: string;
        categoryId?: string;
    }
): Promise<Product[] | undefined> {
    try {
        if (!email) {
            throw new Error("L'email est requis pour la lecture.");
        }

        const entreprise = await getEntreprise(email);
        if (!entreprise) {
            throw new Error("Aucune entreprise trouvée avec cet email.");
        }

        // Construction du filtre avec un type précis
        const whereClause: Prisma.ProductWhereInput = {
            entrepriseId: entreprise.id,
            ...(filters?.searchName && {
                name: { 
                    contains: filters.searchName,
                    mode: 'insensitive' // Optionnel : pour rendre la recherche insensible à la casse
                }
            }),
            ...(filters?.categoryId && {
                categoryId: filters.categoryId
            })
        };

        const products = await prisma.product.findMany({
            where: whereClause,
            include: {
                category: true,
            }
        });

        return products.map(product => ({
            ...product,
            categoryName: product.category?.name
        }));
    } catch (error) {
        console.error(error);
        return undefined;
    }
}
  
  

export async function readProductById(productId: string, email: string): Promise<Product | undefined> {
    try {
        if (!email) {
            throw new Error("l'email est requis .")
        }

        const entreprise = await getEntreprise(email)
        if (!entreprise) {
            throw new Error("Aucune entreprise trouvée avec cet email.");
        }

        const product = await prisma.product.findUnique({
            where: {
                id: productId,
                entrepriseId: entreprise.id
            },
            include: {
                category: true
            }
        })
        if (!product) {
            return undefined
        }

        return {
            ...product,
            categoryName: product.category?.name
        }
    } catch (error) {
        console.error(error)
    }
}

export async function replenishStockWithTransaction(productId: string, quantity: number, email: string) {
    try {

        if (quantity <= 0) {
            throw new Error("La quantité à ajouter doit être supérieure à zéro.")
        }

        if (!email) {
            throw new Error("l'email est requis .")
        }

        const entreprise = await getEntreprise(email)
        if (!entreprise) {
            throw new Error("Aucune entreprise trouvée avec cet email.");
        }

        await prisma.product.update({
            where: {
                id: productId,
                entrepriseId: entreprise.id
            },
            data: {
                quantity: {
                    increment: quantity
                }
            }
        })

        await prisma.transaction.create({
            data: {
                type: "IN",
                quantity: quantity,
                productId: productId,
                entrepriseId: entreprise.id
            }
        })

    } catch (error) {
        console.error(error)
    }
}

export async function deductStockWithTransaction(orderItems: OrderItem[], email: string) {
    try {

        if (!email) {
            throw new Error("l'email est requis .")
        }

        const entreprise = await getEntreprise(email)
        if (!entreprise) {
            throw new Error("Aucune entreprise trouvée avec cet email.");
        }

        for (const item of orderItems) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId }
            })

            if (!product) {
                throw new Error(`Produit avec l'ID ${item.productId} introuvable.`)
            }

            if (item.quantity <= 0) {
                throw new Error(`La quantité demandée pour "${product.name}" doit être supérieure à zéro.`)
            }

            if (product.quantity < item.quantity) {
                throw new Error(`Le produit "${product.name}" n'a pas assez de stock. Demandé: ${item.quantity}, Disponible: ${product.quantity} / ${product.unit}.`)
            }
        }

        await prisma.$transaction(async (tx) => {
            for (const item of orderItems) {
                await tx.product.update({
                    where: {
                        id: item.productId,
                        entrepriseId: entreprise.id
                    },
                    data: {
                        quantity: {
                            decrement: item.quantity,
                        }
                    }
                });
                await tx.transaction.create({
                    data: {
                        type: "OUT",
                        quantity: item.quantity,
                        productId: item.productId,
                        entrepriseId: entreprise.id
                    }
                })
            }

        })

        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, message: error }
    }
}

export async function getTransactions(email: string, limit?: number): Promise<Transaction[]> {
    try {
        if (!email) {
            throw new Error("l'email est requis .")
        }

        const entreprise = await getEntreprise(email)
        if (!entreprise) {
            throw new Error("Aucune entreprise trouvée avec cet email.");
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                entrepriseId: entreprise.id
            },
            orderBy: {
                createdAt: "desc"
            },
            take: limit,
            include: {
                product: {
                    include: {
                        category: true
                    }
                }
            }
        })

        return transactions.map((tx) => ({
            ...tx,
            categoryName: tx.product.category.name,
            productName: tx.product.name,
            imageUrl: tx.product.imageUrl,
            price: tx.product.price,
            unit: tx.product.unit,
        }))
    } catch (error) {
        console.error(error)
        return []
    }
}

export async function getProductOverviewStats(email: string): Promise<ProductOverviewStats> {
    try {
        if (!email) {
            throw new Error("l'email est requis .")
        }

        const entreprise = await getEntreprise(email)
        if (!entreprise) {
            throw new Error("Aucune entreprise trouvée avec cet email.");
        }

        const products = await prisma.product.findMany({
            where: {
                entrepriseId: entreprise.id
            },
            orderBy: {
                createdAt: "desc"
            },
            include: {
                category: true
            }
        })

        const transactions = await prisma.transaction.findMany(
            {
                where: {
                    entrepriseId: entreprise.id
                },
            }
        )

        const categoriesSet = new Set(products.map((product) => product.category.name))

        const totalProducts = products.length
        const totalCategories = categoriesSet.size
        const totalTransactions = transactions.length
        const stockValue = products.reduce((acc, product) => {
            return acc + product.price * product.quantity
        }, 0)

        return {
            totalProducts,
            totalCategories,
            totalTransactions,
            stockValue,
        }
    } catch (error) {
        console.error(error)

        return {
            totalProducts: 0,
            totalCategories: 0,
            totalTransactions: 0,
            stockValue: 0,
        }
    }
}

export async function getProductCategoryDistribution(email: string) {
    try {
        if (!email) {
            throw new Error("l'email est requis .")
        }

        const entreprise = await getEntreprise(email)
        if (!entreprise) {
            throw new Error("Aucune entreprise trouvée avec cet email.");
        }

        const R = 5

        const categoriesWithProductCount = await prisma.category.findMany({
            where: {
                entrepriseId: entreprise.id
            },
            include: {
                products: {
                    select: {
                        id: true
                    }
                }
            }
        })

        const data = categoriesWithProductCount
            .map((category) => (
                {
                    name: category.name,
                    value: category.products.length
                }
            ))
            .sort((a, b) => b.value - a.value)
            .slice(0, R)

        return data

    } catch (error) {
        console.error(error)
    }
}

export async function getStockSummary(email: string): Promise<StockSummary> {
    try {
        if (!email) {
            throw new Error("L'email est requis.");
        }

        const entreprise = await getEntreprise(email);
        if (!entreprise) {
            throw new Error("Aucune entreprise trouvée avec cet email.");
        }

        const allProducts = await prisma.product.findMany({
            where: {
                entrepriseId: entreprise.id
            },
            include: {
                category: true
            }
        });

        // Définition des seuils de stock
        const IN_STOCK_MIN = 20; // Seuil modifiable selon vos besoins
        const inStock = allProducts.filter((p) => p.quantity > IN_STOCK_MIN);
        const lowStock = allProducts.filter((p) => p.quantity > 0 && p.quantity <= IN_STOCK_MIN); // Correction ici
        const outOfStock = allProducts.filter((p) => p.quantity === 0);
        const criticalProducts = [...lowStock, ...outOfStock];

        return {
            inStockCount: inStock.length,
            lowStockCount: lowStock.length,
            outOfStockCount: outOfStock.length,
            criticalProducts: criticalProducts.map((p) => ({
                id: p.id,
                name: p.name,
                quantity: p.quantity,
                categoryName: p.category?.name || "Non catégorisé", // Gestion du cas undefined
                imageUrl: p.imageUrl // Ajout des champs nécessaires à l'UI
            }))
        };

    } catch (error) {
        console.error(error);
        return {
            inStockCount: 0,
            lowStockCount: 0,
            outOfStockCount: 0,
            criticalProducts: []
        };
    }
}