"use client"
import React, { useEffect, useState, useCallback } from 'react'
import Wrapper from '../components/Wrapper'
import { useUser } from '@clerk/nextjs'
import { Product } from '@/type'
import { deleteProduct, readProducts } from '../actions'
import EmptyState from '../components/EmptyState'
import ProductImage from '../components/ProductImage'
import Link from 'next/link'
import { Trash, Search } from 'lucide-react'
import { toast } from 'react-toastify'

const ProductsPage = () => {
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress as string
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      if (!email) return

      const result = await readProducts(email, {
        searchName: searchTerm,
        categoryId: categoryFilter
      })

      if (result) {
        setProducts(result)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast.error('Échec du chargement des produits')
    } finally {
      setIsLoading(false)
    }
  }, [email, searchTerm, categoryFilter])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleDelete = async (product: Product) => {
    if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return

    try {
      if (product.imageUrl) {
        const res = await fetch('/api/upload', {
          method: 'DELETE',
          body: JSON.stringify({ path: product.imageUrl }),
          headers: { 'Content-Type': 'application/json' }
        })

        if (!res.ok) throw new Error('Erreur lors de la suppression de l’image.')
      }

      if (email) {
        await deleteProduct(product.id, email)
        toast.success('Produit supprimé avec succès')
        await fetchProducts()
      }
    } catch (error) {
      console.error('Échec de la suppression:', error)
      toast.error('Échec de la suppression du produit')
    }
  }

  const categories = Array.from(new Set(products.map(p => p.categoryName)))

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
        {isLoading ? (
          <div className="flex justify-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            message='Aucun produit disponible'
            IconComponent='PackageSearch'
          />
        ) : (
          <table className='table'>
            <thead>
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Nom</th>
                <th>Référence</th>
                <th>Description</th>
                <th>Quantité</th>
                <th>Catégorie</th>
                <th>Sous-catégorie</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product.id}>
                  <td>{index + 1}</td>
                  <td>
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      heightClass='h-12'
                      widthClass='w-12'
                    />
                  </td>
                  <td>{product.name}</td>
                  <td>{product.reference || '—'}</td>
                  <td className="max-w-xs truncate">{product.description}</td>
                  <td>{product.quantity} {product.unit}</td>
                  <td>{product.categoryName}</td>
                  <td>{product.subCategoryName || '—'}</td>
                  <td className='flex gap-2'>
                    <Link 
                      href={`/update-product/${product.id}`}
                      className='btn btn-xs btn-primary'
                    >
                      Modifier
                    </Link>
                    <button 
                      onClick={() => handleDelete(product)}
                      className='btn btn-xs btn-error'
                    >
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

export default ProductsPage
