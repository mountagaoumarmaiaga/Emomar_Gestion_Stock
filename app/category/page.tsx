"use client"
import React, { useEffect, useState, useCallback } from 'react'
import Wrapper from '../components/Wrapper'
import CategoryModal from '../components/CategoryModal'
import SubCategoryModal from '../components/SubCategoryModal '
import { useUser } from '@clerk/nextjs'
import { 
  createCategory, 
  deleteCategory, 
  readCategoriesWithSub, 
  updateCategory,
  createSubCategory,
  deleteSubCategory,
  updateSubCategory
} from '../actions'
import { toast } from 'react-toastify'
import EmptyState from '../components/EmptyState'
import { Pencil, Trash, Plus } from 'lucide-react'
import { CategoryWithSub } from '@/type'
import { SubCategory } from '@prisma/client'

const Page = () => {
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress as string

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryWithSub[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [showSubCategories, setShowSubCategories] = useState<Record<string, boolean>>({})

  const loadCategories = useCallback(async () => {
    if (email) {
      try {
        const data = await readCategoriesWithSub(email)
        setCategories(data)

        const visibility: Record<string, boolean> = {}
        data.forEach(cat => {
          visibility[cat.id] = false
        })
        setShowSubCategories(visibility)
      } catch (error) {
        console.error("Échec du chargement des catégories", error)
        toast.error("Échec du chargement des catégories")
      }
    }
  }, [email])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // Gestion des catégories
  const openCreateModal = () => {
    setName("")
    setDescription("")
    setEditMode(false)
    setEditingId(null)
    setSelectedCategoryId(null)
    ;(document.getElementById("category_modal") as HTMLDialogElement)?.showModal()
  }

  const openEditCategoryModal = (category: CategoryWithSub) => {
    setName(category.name)
    setDescription(category.description || "")
    setEditMode(true)
    setEditingId(category.id)
    ;(document.getElementById("category_modal") as HTMLDialogElement)?.showModal()
  }

  const handleCreateCategory = async () => {
    setLoading(true)
    try {
      await createCategory(name, email, description)
      await loadCategories()
      ;(document.getElementById("category_modal") as HTMLDialogElement)?.close()
      toast.success("Catégorie créée avec succès")
    } catch (error) {
      console.error(error)
      toast.error("Échec de la création de la catégorie")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingId) return
    setLoading(true)
    try {
      await updateCategory(editingId, email, name, description)
      await loadCategories()
      ;(document.getElementById("category_modal") as HTMLDialogElement)?.close()
      toast.success("Catégorie mise à jour avec succès")
    } catch (error) {
      console.error(error)
      toast.error("Échec de la mise à jour de la catégorie")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Supprimer cette catégorie et toutes ses sous-catégories ?")) return
    try {
      await deleteCategory(categoryId, email)
      await loadCategories()
      toast.success("Catégorie supprimée avec succès")
    } catch (error) {
      console.error(error)
      toast.error("Échec de la suppression de la catégorie")
    }
  }

  // Gestion des sous-catégories
  const toggleSubCategories = (categoryId: string) => {
    setShowSubCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const openCreateSubCategoryModal = (categoryId: string) => {
    setName("")
    setDescription("")
    setEditMode(false)
    setEditingId(null)
    setSelectedCategoryId(categoryId)
    ;(document.getElementById("subcategory_modal") as HTMLDialogElement)?.showModal()
  }

  const openEditSubCategoryModal = (subCategory: SubCategory) => {
    setName(subCategory.name)
    setDescription(subCategory.description || "")
    setEditMode(true)
    setEditingId(subCategory.id)
    setSelectedCategoryId(subCategory.categoryId)
    ;(document.getElementById("subcategory_modal") as HTMLDialogElement)?.showModal()
  }

  const handleCreateSubCategory = async () => {
    if (!selectedCategoryId) return
    setLoading(true)
    try {
      await createSubCategory(name, selectedCategoryId, email, description)
      await loadCategories()
      ;(document.getElementById("subcategory_modal") as HTMLDialogElement)?.close()
      toast.success("Sous-catégorie créée avec succès")
    } catch (error) {
      console.error(error)
      toast.error("Échec de la création de la sous-catégorie")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSubCategory = async () => {
    if (!editingId) return
    setLoading(true)
    try {
      await updateSubCategory(editingId, email, name, description)
      await loadCategories()
      ;(document.getElementById("subcategory_modal") as HTMLDialogElement)?.close()
      toast.success("Sous-catégorie mise à jour avec succès")
    } catch (error) {
      console.error(error)
      toast.error("Échec de la mise à jour de la sous-catégorie")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSubCategory = async (subCategoryId: string) => {
    if (!confirm("Supprimer cette sous-catégorie ?")) return
    try {
      await deleteSubCategory(subCategoryId, email)
      await loadCategories()
      toast.success("Sous-catégorie supprimée avec succès")
    } catch (error) {
      console.error(error)
      toast.error("Échec de la suppression de la sous-catégorie")
    }
  }

  return (
    <Wrapper>
      <div>
        <div className='mb-4'>
          <button className='btn btn-primary' onClick={openCreateModal}>
            Ajouter une catégorie
          </button>
        </div>

        {categories.length > 0 ? (
          <div className='space-y-4'>
            {categories.map((category) => (
              <div key={category.id} className='border-2 border-base-200 rounded-3xl overflow-hidden'>
                <div className='p-5 flex justify-between items-center bg-base-100'>
                  <div className='flex items-center gap-3'>
                    <button 
                      onClick={() => toggleSubCategories(category.id)}
                      className='btn btn-circle btn-sm'
                    >
                      {showSubCategories[category.id] ? '−' : '+'}
                    </button>
                    <div>
                      <strong className='text-lg'>{category.name}</strong>
                      <div className='text-sm'>{category.description}</div>
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <button 
                      className='btn btn-sm btn-success'
                      onClick={() => openCreateSubCategoryModal(category.id)}
                    >
                      <Plus className='w-4 h-4' />
                    </button>
                    <button 
                      className='btn btn-sm' 
                      onClick={() => openEditCategoryModal(category)}
                    >
                      <Pencil className='w-4 h-4' />
                    </button>
                    <button 
                      className='btn btn-sm btn-error' 
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash className='w-4 h-4' />
                    </button>
                  </div>
                </div>

                {showSubCategories[category.id] && (
                  <div className='bg-base-200 p-4 space-y-3'>
                    {category.subCategories && category.subCategories.length > 0 ? (
                      category.subCategories.map((subCategory) => (
                        <div key={subCategory.id} className='p-3 bg-base-100 rounded-lg flex justify-between items-center'>
                          <div>
                            <strong>{subCategory.name}</strong>
                            <div className='text-sm'>{subCategory.description}</div>
                          </div>
                          <div className='flex gap-2'>
                            <button 
                              className='btn btn-xs' 
                              onClick={() => openEditSubCategoryModal(subCategory)}
                            >
                              <Pencil className='w-3 h-3' />
                            </button>
                            <button 
                              className='btn btn-xs btn-error' 
                              onClick={() => handleDeleteSubCategory(subCategory.id)}
                            >
                              <Trash className='w-3 h-3' />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className='text-center py-4'>
                        <p>Aucune sous-catégorie</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            message={"Aucune catégorie disponible"}
            IconComponent='Group'
          />
        )}
      </div>

      {/* Modales */}
      <CategoryModal
        title={editMode ? "Modifier la catégorie" : "Créer une catégorie"}
        name={name}
        description={description}
        loading={loading}
        onClose={() => (document.getElementById("category_modal") as HTMLDialogElement)?.close()}
        onChangeName={setName}
        onChangeDescription={setDescription}
        onSubmit={editMode ? handleUpdateCategory : handleCreateCategory}
      />

      <SubCategoryModal
        title={editMode ? "Modifier la sous-catégorie" : "Créer une sous-catégorie"}
        name={name}
        description={description}
        loading={loading}
        onClose={() => (document.getElementById("subcategory_modal") as HTMLDialogElement)?.close()}
        onChangeName={setName}
        onChangeDescription={setDescription}
        onSubmit={editMode ? handleUpdateSubCategory : handleCreateSubCategory}
      />
    </Wrapper>
  )
}

export default Page
