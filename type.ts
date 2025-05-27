import { Product as PrismaProduct, Transaction as PrismaTransaction, Destination as PrismaDestination } from "@prisma/client"

export interface Product extends PrismaProduct {
    categoryName: string;
}

export interface FormDataType {
    id?: string;
    name: string;
    description: string;
    price: number;
    quantity?: number;
    categoryId?: string;
    unit?: string;
    categoryName?: string;
    imageUrl?: string;
}

export interface OrderItem {
    productId: string;
    quantity: number;
    unit: string;
    imageUrl: string;
    name: string;
    availableQuantity: number;
};

export interface Destination extends PrismaDestination {
    transactionCount?: number;
}

export interface Transaction extends PrismaTransaction {
    categoryName: string;
    productName: string;
    imageUrl?: string;
    price: number;
    unit: string;
    destination?: {
        id: string;
        name: string;
        description: string | null;
        entrepriseId?: string | null;
    };
}

export interface ProductOverviewStats {
    totalProducts: number;
    totalCategories: number;
    totalTransactions: number;
    stockValue: number;
}

export interface ChartData {
    name: string;
    value: number;
}

interface CriticalProduct {
    id: string;
    name: string;
    quantity: number;
    categoryName: string;
    imageUrl?: string;
    unit?: string;
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