"use client"

import { use } from 'react'
import { readProductById, updateProduct, readCategoriesWithSub, readSubCategoriesWithCount } from '@/app/actions'
import ProductImage from '@/app/components/ProductImage'
import Wrapper from '@/app/components/Wrapper'
import { FormDataType, Product, CategoryWithSub } from '@/type'
import { useUser } from '@clerk/nextjs'
import { FileImage } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { SubCategory } from '@prisma/client'

const Page = ({ params }: { params: Promise<{ productId: string }> }) => {
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress as string
  const { productId } = use(params)

  const [product, setProduct] = useState<Product | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryWithSub[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState<FormDataType>({
    id: "",
    name: "",
    description: "",
    imageUrl: "",
    categoryId: "",
    subCategoryId: "",
    unit: "",
    reference: "",
    categoryName: "",
    subCategoryName: ""
  })

  const router = useRouter()

  // Charger les données initiales
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Charger les catégories
      const categoriesData = await readCategoriesWithSub(email)
      setCategories(categoriesData)

      // Charger le produit
      const fetchedProduct = await readProductById(productId, email)
      if (fetchedProduct) {
        setProduct(fetchedProduct)
        setFormData({
          id: fetchedProduct.id,
          name: fetchedProduct.name,
          description: fetchedProduct.description,
          imageUrl: fetchedProduct.imageUrl,
          categoryId: fetchedProduct.categoryId,
          subCategoryId: fetchedProduct.subCategoryId || "",
          unit: fetchedProduct.unit || "",
          reference: fetchedProduct.reference || "",
          
          categoryName: fetchedProduct.categoryName || "",
          subCategoryName: fetchedProduct.subCategoryName || ""
        })

        // Charger les sous-catégories si une catégorie est sélectionnée
        if (fetchedProduct.categoryId) {
          const subs = await readSubCategoriesWithCount(email, fetchedProduct.categoryId)
          setSubCategories(subs)
        }
      }
    } catch (error) {
      console.error(error)
      toast.error("Échec du chargement des données")
    } finally {
      setIsLoading(false)
    }
  }, [email, productId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Gérer le changement de catégorie
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!formData.categoryId) {
        setSubCategories([])
        setFormData(prev => ({ ...prev, subCategoryId: "" }))
        return
      }

      try {
        const data = await readSubCategoriesWithCount(email, formData.categoryId)
        setSubCategories(data)
      } catch (error) {
        console.error("Erreur lors du chargement des sous-catégories", error)
        toast.error("Erreur lors du chargement des sous-catégories")
      }
    }

    if (formData.categoryId) {
      fetchSubCategories()
    }
  }, [formData.categoryId, email])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)
      let imageUrl = formData.imageUrl

      // Gestion de l'image
      if (file) {
        // Supprimer l'ancienne image si elle existe
        if (formData.imageUrl) {
          const resDelete = await fetch("/api/upload", {
            method: "DELETE",
            body: JSON.stringify({ path: formData.imageUrl }),
            headers: { 'Content-Type': 'application/json' }
          })
          const dataDelete = await resDelete.json()
          if (!dataDelete.success) {
            throw new Error("Erreur lors de la suppression de l'ancienne image")
          }
        }

        // Uploader la nouvelle image
        const imageData = new FormData()
        imageData.append("file", file)
        const res = await fetch("/api/upload", {
          method: "POST",
          body: imageData
        })

        const data = await res.json()
        if (!data.success) {
          throw new Error("Erreur lors de l'upload de la nouvelle image")
        }

        imageUrl = data.path
      }

      // Préparer les données à mettre à jour
      const updatedData = {
        ...formData,
        imageUrl,
        subCategoryId: formData.subCategoryId || null,
        reference: formData.reference || null
      }

      await updateProduct(updatedData, email)
      toast.success("Produit mis à jour avec succès !")
      router.push("/products")
    } catch (error: unknown) {
      console.error(error)
      const message = error instanceof Error ? error.message : "Une erreur inconnue est survenue"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Wrapper>
        <div className='flex justify-center items-center w-full h-64'>
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </Wrapper>
    )
  }

  if (!product) {
    return (
      <Wrapper>
        <div className='flex justify-center items-center w-full h-64'>
          <p>Produit non trouvé</p>
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <div>
        <h1 className='text-2xl font-bold mb-6'>Modifier le produit</h1>
        
        <div className='flex flex-col md:flex-row gap-6'>
          <form onSubmit={handleSubmit} className='flex-1 space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='form-control'>
                <label className='label'>
                  <span className='label-text'>Nom*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className='input input-bordered w-full'
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className='form-control'>
                <label className='label'>
                  <span className='label-text'>Référence</span>
                </label>
                <input
                  type="text"
                  name="reference"
                  className='input input-bordered w-full'
                  value={formData.reference?? ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className='form-control'>
              <label className='label'>
                <span className='label-text'>Description*</span>
              </label>
              <textarea
                name="description"
                className='textarea textarea-bordered w-full'
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                required
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='form-control'>
                <label className='label'>
                  <span className='label-text'>Catégorie*</span>
                </label>
                <select
                  name="categoryId"
                  className='select select-bordered w-full'
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div className='form-control'>
                <label className='label'>
                  <span className='label-text'>Sous-catégorie</span>
                </label>
                <select
                  name="subCategoryId"
                  className='select select-bordered w-full'
                  value={formData.subCategoryId ?? ""}

                  onChange={handleInputChange}
                  disabled={!formData.categoryId}
                >
                  <option value="">Sélectionner une sous-catégorie</option>
                  {subCategories.map(subCategory => (
                    <option key={subCategory.id} value={subCategory.id}>{subCategory.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='form-control'>
                <label className='label'>
                  <span className='label-text'>Unité*</span>
                </label>
                <select
                  name="unit"
                  className='select select-bordered w-full'
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Sélectionner une unité</option>
                  <option value="kg">Kilogramme</option>
                  <option value="g">Gramme</option>
                  <option value="L">Litre</option>
                  <option value="m">Mètre</option>
                  <option value="pcs">Pièce</option>
                </select>
              </div>

              
            </div>

            <div className='form-control'>
              <label className='label'>
                <span className='label-text'>Image du produit</span>
              </label>
              <input
                type="file"
                accept='image/*'
                className='file-input file-input-bordered w-full'
                onChange={handleFileChange}
              />
            </div>

            <button 
              type='submit' 
              className='btn btn-primary mt-6 w-full'
              disabled={isLoading}
            >
              {isLoading ? 'Enregistrement...' : 'Mettre à jour'}
            </button>
          </form>

          <div className='flex md:flex-col md:ml-4 mt-4 md:mt-0'>
                <div className='md:ml-4 md:w-[200px] mt-4 md:mt-0 border-2 border-primary md:h-[200px] p-5 justify-center items-center rounded-3xl hidden md:flex'>
                  {formData.imageUrl ? (
                    <ProductImage
                      src={formData.imageUrl}
                      alt={product.name}
                      heightClass='h-40'
                      widthClass='w-40'
                    />
                  ) : (
                    <div className='wiggle-animation'>
                      <FileImage strokeWidth={1} className='h-10 w-10 text-primary' />
                    </div>
                  )}
                </div>
                <div className='md:ml-4 w-full md:w-[200px] mt-4 border-2 border-primary md:h-[200px] p-5 flex justify-center items-center rounded-3xl md:mt-4'>
                  {previewUrl ? (
                    <ProductImage
                      src={previewUrl}
                      alt="Prévisualisation"
                      heightClass='h-40'
                      widthClass='w-40'
                    />
                  ) : (
                    <div className='wiggle-animation'>
                      <FileImage strokeWidth={1} className='h-10 w-10 text-primary' />
                    </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </Wrapper>
  )
}

export default Page