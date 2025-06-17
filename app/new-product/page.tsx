"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '../components/Wrapper'
import { useUser } from '@clerk/nextjs'
import { Category, SubCategory } from '@prisma/client'
import { FormDataType } from '@/type'
import { createProduct, readCategories, readSubCategories } from '../actions'
import { FileImage } from 'lucide-react'
import ProductImage from '../components/ProductImage'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'

const Page = () => {
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress as string
  const router = useRouter()

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    description: "",
    categoryId: "",
    subCategoryId: "",
    unit: "",
    reference: "",
    imageUrl: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        if (email) {
          const data = await readCategories(email)
          if (data) setCategories(data)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des catégories", error)
        toast.error("Erreur lors du chargement des catégories")
      }
    }
    fetchCategories()
  }, [email])

  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!formData.categoryId) {
        setSubCategories([])
        return
      }

      try {
        const data = await readSubCategories(email, formData.categoryId)
        if (data) setSubCategories(data)
      } catch (error) {
        console.error("Erreur lors du chargement des sous-catégories", error)
        toast.error("Erreur lors du chargement des sous-catégories")
      }
    }

    fetchSubCategories()
  }, [formData.categoryId, email])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile))
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.categoryId || !formData.unit) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    if (!file) {
      toast.error("Veuillez sélectionner une image")
      return
    }

    try {
      const imageData = new FormData()
      imageData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: imageData
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error("Erreur lors de l'upload de l'image")
      }

      await createProduct({
        ...formData,
        imageUrl: data.path
      }, email)

      toast.success("Produit créé avec succès")
      router.push("/products")
    } catch (error) {
      console.error(error)
      toast.error("Une erreur est survenue lors de la création du produit")
    }
  }

  return (
    <Wrapper>
      <div className='flex justify-center items-center'>
        <div>
          <h1 className='text-2xl font-bold mb-4'>
            Créer un produit
          </h1>

          <section className='flex md:flex-row flex-col'>
            <div className='space-y-4 md:w-[450px]'>
              <input
                type="text"
                name="name"
                placeholder="Nom"
                className='input input-bordered w-full'
                value={formData.name}
                onChange={handleChange}
              />

              <input
                type="text"
                name="reference"
                placeholder="Référence"
                className='input input-bordered w-full'
                value={formData.reference?? ""}
                onChange={handleChange}
              />

              <textarea
                name="description"
                placeholder="Description"
                className='textarea textarea-bordered w-full'
                value={formData.description}
                onChange={handleChange}
              />

              <select
                className='select select-bordered w-full'
                value={formData.categoryId}
                onChange={handleChange}
                name='categoryId'
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <select
                className='select select-bordered w-full'
                value={formData.subCategoryId?? ""}
                onChange={handleChange}
                name='subCategoryId'
                disabled={!formData.categoryId}
              >
                <option value="">Sélectionner une sous-catégorie</option>
                {subCategories.map((subCat) => (
                  <option key={subCat.id} value={subCat.id}>{subCat.name}</option>
                ))}
              </select>

              <select
                className='select select-bordered w-full'
                value={formData.unit}
                onChange={handleChange}
                name='unit'
              >
                <option value="">Sélectionner unité</option>
                <option value="kg">Kilogramme</option>
                <option value="m">Mètre</option>
                <option value="pcs">Pièces</option>
              </select>

              <input
                type="file"
                accept='image/*'
                placeholder="Image"
                className='file-input file-input-bordered w-full'
                onChange={handleFileChange}
              />

              <button onClick={handleSubmit} className='btn btn-primary'>
                Créer le produit
              </button>
            </div>

            <div className='md:ml-4 md:w-[200px] mt-4 md:mt-0 border-2 border-primary md:h-[300px] p-5 flex justify-center items-center rounded-3xl'>
              {previewUrl ? (
                <ProductImage
                  src={previewUrl}
                  alt="preview"
                  heightClass='h-40'
                  widthClass='w-40'
                />
              ) : (
                <div className='wiggle-animation'>
                  <FileImage strokeWidth={1} className='h-10 w-10 text-primary' />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </Wrapper>
  )
}

export default Page
