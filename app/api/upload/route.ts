import { existsSync } from "fs";
import { mkdir, writeFile, unlink } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { join, resolve, normalize } from "path";

// Extensions autorisées
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData()
        const file: File | null = data.get("file") as unknown as File

        if (!file) {
            return NextResponse.json(
                { success: false, message: "Aucun fichier fourni" },
                { status: 400 }
            );
        }

        // Vérification taille du fichier
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, message: "Fichier trop volumineux (max 5MB)" },
                { status: 400 }
            );
        }

        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
            return NextResponse.json(
                { success: false, message: "Type de fichier non autorisé" },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Chemin sécurisé
        const uploadDir = resolve(process.cwd(), "public", "uploads")
        const safeUploadDir = normalize(uploadDir).replace(/^(\.\.(\/|\\|$))+/g, '')

        if (!existsSync(safeUploadDir)) {
            await mkdir(safeUploadDir, { recursive: true })
        }

        const UniqueName = crypto.randomUUID() + '.' + ext
        const filePath = join(safeUploadDir, UniqueName)
        
        await writeFile(filePath, buffer)
        const publicPath = `/uploads/${UniqueName}`

        return NextResponse.json(
            { success: true, path: publicPath },
            { status: 201 }
        );

    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { success: false, message: "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { path } = await request.json()
        
        if (!path || !path.startsWith('/uploads/')) {
            return NextResponse.json(
                { success: false, message: "Chemin invalide" },
                { status: 400 }
            );
        }

        // Sécurisation du chemin
        const basePath = resolve(process.cwd(), "public")
        const fullPath = join(basePath, path)
        const normalizedPath = normalize(fullPath)

        if (!normalizedPath.startsWith(basePath)) {
            return NextResponse.json(
                { success: false, message: "Chemin non autorisé" },
                { status: 403 }
            );
        }

        if (!existsSync(normalizedPath)) {
            return NextResponse.json(
                { success: false, message: "Fichier non trouvé" },
                { status: 404 }
            );
        }

        await unlink(normalizedPath)
        return NextResponse.json(
            { success: true, message: "Fichier supprimé avec succès" },
            { status: 200 }
        );

    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { success: false, message: "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}