"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '../components/Wrapper'
import { useUser } from '@clerk/nextjs'
import { Category } from '@prisma/client'
import { FormDataType } from '@/type'
import { createProduct, readCategories } from '../actions'
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
  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    description: "",
    categoryId: "",
    unit: "",
    imageUrl: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        if (email) {
          const data = await readCategories(email)
          if (data)
            setCategories(data)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des catégories", error)
      }
    }
    fetchCategories()
  }, [email])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile))
    }
  }

  const handleSubmit = async () => {
    // Vérifie les champs du formulaire (prix retiré des vérifications)
    if (!formData.name || !formData.description || !formData.categoryId || !formData.unit) {
      toast.error("Veuillez remplir tous les champs du formulaire.")
      return
    }

    if (!file) {
      toast.error("Veuillez sélectionner une image.")
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
        throw new Error("Erreur lors de l'upload de l'image.")
      }

      formData.imageUrl = data.path
      await createProduct(formData, email)

      toast.success("Produit créé avec succès")
      router.push("/products")

    } catch (error) {
      console.log(error)
      toast.error("Il y a une erreur")
    }
  }

  return (
    <Wrapper>
      <div className='flex justify-center items-center'>
        <div>
          <h1 className='text-2xl font-bold mb-4'>
            Créer Un produit
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

            <div className='md:ml-4 md:w-[300px] mt-4 md:mt-0 border-2 border-primary md:h-[300px] p-5 flex justify-center items-center rounded-3xl'>
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