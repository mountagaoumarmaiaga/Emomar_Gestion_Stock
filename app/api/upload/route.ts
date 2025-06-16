import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

const BUCKET_NAME = 'image' // Remplace par le nom exact de ton bucket Supabase

// ⬆️ Méthode POST : pour uploader une image
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Aucun fichier reçu.' },
        { status: 400 }
      )
    }

    const ext = file.name.split('.').pop()
    const uniqueName = `${crypto.randomUUID()}.${ext}`
    const filePath = `products/${uniqueName}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        path: filePath,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur POST serveur:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur lors de l\'upload du fichier.' },
      { status: 500 }
    )
  }
}

// ⬇️ Méthode DELETE : pour supprimer une image
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const filePath = body.path

    if (!filePath) {
      return NextResponse.json(
        { success: false, message: 'Chemin du fichier manquant.' },
        { status: 400 }
      )
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { success: false, message: 'Erreur lors de la suppression du fichier.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Erreur DELETE serveur:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur serveur.' },
      { status: 500 }
    )
  }
}
