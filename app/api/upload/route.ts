import { existsSync } from "fs";
import { mkdir, writeFile, unlink } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { join, resolve, normalize } from "path";
import { randomUUID } from "crypto";

// Configuration
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

// Vérification de sécurité du chemin
const isSafePath = (targetPath: string, basePath: string) => {
  const normalizedTarget = normalize(resolve(targetPath));
  const normalizedBase = normalize(resolve(basePath));
  return normalizedTarget.startsWith(normalizedBase);
};

export async function POST(request: NextRequest) {
  try {
    // Vérifier la méthode HTTP
    if (request.method !== "POST") {
      return NextResponse.json(
        { success: false, message: "Méthode non autorisée" },
        { status: 405 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

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

    // Vérification extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { success: false, message: "Type de fichier non autorisé" },
        { status: 400 }
      );
    }

    // Lecture du fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Création du répertoire si inexistant
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Génération d'un nom sécurisé
    const uniqueName = `${randomUUID()}.${ext}`;
    const filePath = join(UPLOAD_DIR, uniqueName);

    // Vérification de sécurité finale
    if (!isSafePath(filePath, UPLOAD_DIR)) {
      return NextResponse.json(
        { success: false, message: "Chemin de fichier non sécurisé" },
        { status: 400 }
      );
    }

    // Écriture du fichier
    await writeFile(filePath, buffer);
    const publicPath = `/uploads/${uniqueName}`;

    return NextResponse.json(
      { success: true, path: publicPath },
      { status: 201 }
    );

  } catch (error) {
    console.error("Erreur d'upload:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: process.env.NODE_ENV === "development" 
          ? `Erreur serveur: ${error instanceof Error ? error.message : String(error)}` 
          : "Erreur interne du serveur" 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Vérifier la méthode HTTP
    if (request.method !== "DELETE") {
      return NextResponse.json(
        { success: false, message: "Méthode non autorisée" },
        { status: 405 }
      );
    }

    const { path: filePath } = await request.json();
    
    if (!filePath || !filePath.startsWith('/uploads/')) {
      return NextResponse.json(
        { success: false, message: "Chemin invalide" },
        { status: 400 }
      );
    }

    // Construction du chemin sécurisé
    const fullPath = join(process.cwd(), "public", filePath);
    
    if (!isSafePath(fullPath, UPLOAD_DIR)) {
      return NextResponse.json(
        { success: false, message: "Chemin non autorisé" },
        { status: 403 }
      );
    }

    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { success: false, message: "Fichier non trouvé" },
        { status: 404 }
      );
    }

    await unlink(fullPath);
    return NextResponse.json(
      { success: true, message: "Fichier supprimé avec succès" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erreur de suppression:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: process.env.NODE_ENV === "development" 
          ? `Erreur serveur: ${error instanceof Error ? error.message : String(error)}` 
          : "Erreur interne du serveur" 
      },
      { status: 500 }
    );
  }
}