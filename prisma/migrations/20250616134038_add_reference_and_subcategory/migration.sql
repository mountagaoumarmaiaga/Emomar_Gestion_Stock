/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "reference" TEXT,
ADD COLUMN     "subCategoryId" TEXT;

-- CreateTable
CREATE TABLE "SubCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "entrepriseId" TEXT,

    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_reference_key" ON "Product"("reference");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
