"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '../components/Wrapper'
import { useUser } from '@clerk/nextjs'
import { Product } from '@/type'
import { deleteProduct, readProducts } from '../actions'
import EmptyState from '../components/EmptyState'
import ProductImage from '../components/ProductImage'
import Link from 'next/link'
import { Trash, Search } from 'lucide-react'
import { toast } from 'react-toastify'

const Page = () => {
    const { user } = useUser()
    const email = user?.primaryEmailAddress?.emailAddress as string
    const [products, setProducts] = useState<Product[]>([])
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')

    // Récupérer les produits avec filtres
    const fetchProducts = async () => {
        try {
            if (email) {
                const products = await readProducts(email, {
                    searchName: searchTerm,
                    categoryId: categoryFilter
                })
                if (products) {
                    setProducts(products)
                    setFilteredProducts(products)
                }
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        if (email)
            fetchProducts()
    }, [email, searchTerm, categoryFilter])

    const handleDeleteProduct = async (product: Product) => {
        const confirmDelete = confirm("Voulez-vous vraiment supprimer ce produit ?")
        if (!confirmDelete) return;
        try {
            if (product.imageUrl) {
                const resDelete = await fetch("/api/upload", {
                    method: "DELETE",
                    body: JSON.stringify({ path: product.imageUrl }),
                    headers: { 'Content-Type': 'application/json' }
                })
                const dataDelete = await resDelete.json()
                if (!dataDelete.success) {
                    throw new Error("Erreur lors de la suppression de l'image.")
                } else {
                    if (email) {
                        await deleteProduct(product.id, email)
                        await fetchProducts()
                        toast.success("Produit supprimé avec succès")
                    }
                }
            }
        } catch (error) {
            console.error(error)
        }
    }

    // Extraire les catégories uniques pour le filtre
    const categories = [...new Set(products.map(p => p.categoryName))]

    return (
        <Wrapper>
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-1/2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Rechercher par nom..."
                        className="input input-bordered w-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <select
                    className="select select-bordered w-full md:w-1/3"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="">Toutes les catégories</option>
                    {categories.map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </div>

            <div className='overflow-x-auto'>
                {filteredProducts.length === 0 ? (
                    <div>
                        <EmptyState
                            message='Aucun produit disponible'
                            IconComponent='PackageSearch'
                        />
                    </div>
                ) : (
                    <table className='table'>
                        <thead>
                            <tr>
                                <th></th>
                                <th>Image</th>
                                <th>Nom</th>
                                <th>Description</th>
                                <th>Prix</th>
                                <th>Quantité</th>
                                <th>Catégorie</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product, index) => (
                                <tr key={product.id}>
                                    <th>{index + 1}</th>
                                    <td>
                                        <ProductImage
                                            src={product.imageUrl}
                                            alt={product.imageUrl}
                                            heightClass='h-12'
                                            widthClass='w-12'
                                        />
                                    </td>
                                    <td>{product.name}</td>
                                    <td>{product.description}</td>
                                    <td>{product.price} XOF</td>
                                    <td className='capitalize'>
                                        {product.quantity} {product.unit}
                                    </td>
                                    <td>{product.categoryName}</td>
                                    <td className='flex gap-2 flex-col'>
                                        <Link className='btn btn-xs w-fit btn-primary' href={`/update-product/${product.id}`}>
                                            Modifier
                                        </Link>
                                        <button className='btn btn-xs w-fit' onClick={() => handleDeleteProduct(product)}>
                                            <Trash className='w-4 h-4' />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </Wrapper>
    )
}

export default Page