"use client"
import { readProductById, updateProduct } from '@/app/actions'
import ProductImage from '@/app/components/ProductImage'
import Wrapper from '@/app/components/Wrapper'
import { FormDataType, Product } from '@/type'
import { useUser } from '@clerk/nextjs'
import { FileImage } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-toastify'

const Page = ({ params }: { params: Promise<{ productId: string }> }) => {
    const { user } = useUser()
    const email = user?.primaryEmailAddress?.emailAddress as string
    const [product, setProduct] = useState<Product | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [formData, setFormData] = useState<FormDataType>({
        id: "",
        name: "",
        description: "",
        imageUrl: "",
        categoryName: ""
    })
    const router = useRouter()

    const fetchProduct = useCallback(async () => {
        try {
            const { productId } = await params
            if (email) {
                const fetchedProduct = await readProductById(productId, email)
                if (fetchedProduct) {
                    setProduct(fetchedProduct)
                    setFormData({
                        id: fetchedProduct.id,
                        name: fetchedProduct.name,
                        description: fetchedProduct.description,
                        imageUrl: fetchedProduct.imageUrl,
                        categoryName: fetchedProduct.categoryName
                    })
                }
            }
        } catch (error) {
            console.error(error)
            toast.error("Échec du chargement des détails du produit")
        }
    }, [email, params])

    useEffect(() => {
        fetchProduct()
    }, [email, fetchProduct])

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
            let imageUrl = formData.imageUrl
            
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

            // Mettre à jour le produit avec les nouvelles données
            const updatedData = {
                ...formData,
                imageUrl
            }

            await updateProduct(updatedData, email)
            toast.success("Produit mis à jour avec succès !")
            router.push("/products")
        } catch (error: unknown) {
            console.error(error)
            const message = error instanceof Error ? error.message : "Une erreur inconnue est survenue"
            toast.error(message)
        }
    }

    return (
        <Wrapper>
            <div>
                {product ? (
                    <div>
                        <h1 className='text-2xl font-bold mb-4'>
                            Modifier le produit
                        </h1>
                        <div className='flex md:flex-row flex-col md:items-center'>
                            <form className='space-y-2' onSubmit={handleSubmit}>
                                <div className='text-sm font-semibold mb-2'>Nom</div>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Nom"
                                    className='input input-bordered w-full'
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                                <div className='text-sm font-semibold mb-2'>Description</div>
                                <textarea
                                    name="description"
                                    placeholder="Description"
                                    className='textarea textarea-bordered w-full'
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                />
                                <div className='text-sm font-semibold mb-2'>Catégorie</div>
                                <input
                                    type="text"
                                    name="categoryName"
                                    className='input input-bordered w-full'
                                    value={formData.categoryName}
                                    onChange={handleInputChange}
                                    disabled
                                />
                                <div className='text-sm font-semibold mb-2'>Image</div>
                                <input
                                    type="file"
                                    accept='image/*'
                                    className='file-input file-input-bordered w-full'
                                    onChange={handleFileChange}
                                />
                                <button type='submit' className='btn btn-primary mt-3'>
                                    Mettre à jour
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
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className='flex justify-center items-center w-full'>
                        <span className="loading loading-spinner loading-xl"></span>
                    </div>
                )}
            </div>
        </Wrapper>
    )
}

export default Page