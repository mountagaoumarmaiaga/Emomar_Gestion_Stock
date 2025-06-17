// type.ts
import { Product as PrismaProduct, Transaction as PrismaTransaction, Destination as PrismaDestination, SubCategory, Category } from "@prisma/client"

export interface Product extends PrismaProduct {
    categoryName: string;
    subCategoryName?: string;
}

export interface FormDataType {
    id?: string;
    name: string;
    description: string;
    quantity?: number;
    categoryId?: string;
    subCategoryId?: string | null 
    unit?: string;
    categoryName?: string;
    subCategoryName?: string;
    imageUrl?: string;
    reference?: string | null 
    
}

export interface OrderItem {
    productId: string;
    quantity: number;
    unit: string;
    imageUrl: string;
    name: string;
    availableQuantity: number;
    reference?: string;
};

export interface Destination extends PrismaDestination {
    transactionCount?: number;
}

export interface Transaction extends PrismaTransaction {
    categoryName: string;
    subCategoryName?: string;
    
    productName: string;
    imageUrl?: string;
    unit: string;
    reference?: string;
    destination?: Destination;
}

export interface ProductOverviewStats {
    totalProducts: number;
    totalCategories: number;
    totalSubCategories?: number;
    totalTransactions: number;
}

export interface ChartData {
    name: string;
    value: number;
    subCategories?: {
        name: string;
        value: number;
    }[];
}

interface CriticalProduct {
    id: string;
    name: string;
    quantity: number;
    categoryName: string;
    subCategoryName?: string;
    imageUrl?: string;
    unit?: string;
    reference?: string;
    lastRestocked?: Date; 
}
  
export interface StockSummary {
    inStockCount: number;
    lowStockCount: number; 
    outOfStockCount: number;
    criticalProducts: CriticalProduct[];
    healthPercentage?: number;
}

export interface DestinationOption {
    value: string;
    label: string;
    description?: string;
}

export interface SubCategoryWithCount extends SubCategory {
    _count?: {
        products: number;
    };
    category?: Category;
}

export interface CategoryWithSub extends Category {
    subCategories: SubCategoryWithCount[];
    _count?: {
        products: number;
    };
}