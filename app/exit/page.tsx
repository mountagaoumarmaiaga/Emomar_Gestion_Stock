"use client"

import { OrderItem, Product, Destination } from '@/type'
import { useUser } from '@clerk/nextjs'
import React, { useEffect, useState, useCallback } from 'react'
import { deductStockWithTransaction, readProducts } from '../actions'
import Wrapper from '../components/Wrapper'
import ProductComponent from '../components/ProductComponent'
import EmptyState from '../components/EmptyState'
import ProductImage from '../components/ProductImage'
import { Trash, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'react-toastify'

const DESTINATIONS_PER_PAGE = 5;

const Page = () => {
    const { user } = useUser()
    const email = user?.primaryEmailAddress?.emailAddress as string
    
    // États produits
    const [products, setProducts] = useState<Product[]>([])
    const [order, setOrder] = useState<OrderItem[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
    
    // États destinations
    const [destinations, setDestinations] = useState<Destination[]>([])
    const [selectedDestinationId, setSelectedDestinationId] = useState("")
    const [manualDestination, setManualDestination] = useState("")
    const [destinationSearch, setDestinationSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    
    // États création destination
    const [newDestinationName, setNewDestinationName] = useState("")
    const [newDestinationDesc, setNewDestinationDesc] = useState("")
    const [showAddDestination, setShowAddDestination] = useState(false)
    
    const [isLoading, setIsLoading] = useState(false)

    // Chargement des données
    const fetchData = useCallback(async () => {
        try {
            if (!email) return;
            
            const [productsRes, destinationsRes] = await Promise.all([
                readProducts(email),
                fetch(`/api/destinations?email=${email}`).then(res => res.json())
            ]);
            
            if (productsRes) setProducts(productsRes);
            setDestinations(destinationsRes);
        } catch (error) {
            console.error(error);
            toast.error("Erreur de chargement des données");
        }
    }, [email]);

    useEffect(() => { fetchData() }, [fetchData]);

    // Fonctions de gestion des produits
    const handleAddToCart = (product: Product) => {
        setOrder(prev => {
            const existing = prev.find(item => item.productId === product.id);
            return existing 
                ? prev.map(item => 
                    item.productId === product.id 
                        ? { ...item, quantity: Math.min(item.quantity + 1, product.quantity) } 
                        : item
                )
                : [
                    ...prev,
                    {
                        productId: product.id,
                        quantity: 1,
                        unit: product.unit,
                        imageUrl: product.imageUrl,
                        name: product.name,
                        availableQuantity: product.quantity,
                    }
                ];
        });
        setSelectedProductIds(prev => 
            prev.includes(product.id) ? prev : [...prev, product.id]
        );
    };

    const handleQuantityChange = (productId: string, quantity: number) => {
        setOrder(prev => prev.map(item => 
            item.productId === productId ? { ...item, quantity } : item
        ));
    };

    const handleRemoveFromCart = (productId: string) => {
        setOrder(prev => prev.filter(item => item.productId !== productId));
        setSelectedProductIds(prev => prev.filter(id => id !== productId));
    };

    // Fonctions de gestion des destinations
    const handleAddDestination = async () => {
        if (!newDestinationName.trim()) {
            toast.error("Le nom est obligatoire");
            return;
        }

        try {
            const response = await fetch('/api/destinations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: newDestinationName, 
                    description: newDestinationDesc,
                    email 
                })
            });

            if (!response.ok) throw new Error();
            
            const newDest = await response.json();
            setDestinations(prev => [...prev, newDest]);
            setSelectedDestinationId(newDest.id);
            setNewDestinationName("");
            setNewDestinationDesc("");
            setShowAddDestination(false);
            toast.success("Destination créée");
        } catch (error) {
            console.error(error);
            toast.error("Erreur de création");
        }
    };

    // Soumission de la commande
    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            if (order.length === 0) {
                toast.error("Ajoutez des produits");
                return;
            }
            
            let finalDestinationId = selectedDestinationId;
            if (!finalDestinationId && manualDestination) {
                const response = await fetch('/api/destinations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        name: manualDestination,
                        email 
                    })
                });
                
                if (!response.ok) throw new Error("Erreur création destination");
                const newDest = await response.json();
                finalDestinationId = newDest.id;
                setDestinations(prev => [...prev, newDest]);
            }

            if (!finalDestinationId) {
                toast.error("Sélectionnez ou saisissez une destination");
                return;
            }

            const response = await deductStockWithTransaction(
                order, 
                email,
                finalDestinationId
            );

            if (response?.success) {
                toast.success("Sortie enregistrée");
                setOrder([]);
                setSelectedProductIds([]);
                setSelectedDestinationId("");
                setManualDestination("");
                fetchData();
            } else {
                throw new Error(response?.message);
            }
        } catch (error) {
            console.error(error);
            toast.error((error as Error).message || "Erreur");

        } finally {
            setIsLoading(false);
        }
    };

    // Filtres et pagination
    const filteredProducts = products
        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(p => !selectedProductIds.includes(p.id))
        .slice(0, 10);

    const filteredDestinations = destinations
        .filter(d => 
            d.name.toLowerCase().includes(destinationSearch.toLowerCase()) ||
            (d.description && d.description.toLowerCase().includes(destinationSearch.toLowerCase()))
        );

    const paginatedDestinations = filteredDestinations.slice(
        (currentPage - 1) * DESTINATIONS_PER_PAGE,
        currentPage * DESTINATIONS_PER_PAGE
    );

    return (
        <Wrapper>
            <div className='flex md:flex-row flex-col-reverse gap-4'>
                {/* Colonne produits */}
                <div className='md:w-1/3'>
                    <input
                        type="text"
                        placeholder='Rechercher un produit...'
                        className='input input-bordered w-full mb-4'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    
                    <div className='space-y-4'>
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <ProductComponent
                                    key={product.id}
                                    product={product}
                                    add={true}
                                    handleAddToCart={handleAddToCart}
                                />
                            ))
                        ) : (
                            <EmptyState
                                message='Aucun produit disponible'
                                IconComponent='PackageSearch'
                            />
                        )}
                    </div>
                </div>

                {/* Colonne commande */}
                <div className='md:w-2/3 p-4 h-fit border-2 border-base-200 rounded-3xl'>
                    {order.length > 0 ? (
                        <>
                            {/* Sélection destination */}
                            <div className="mb-6 space-y-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Rechercher une destination..."
                                        className="input input-bordered flex-1"
                                        value={destinationSearch}
                                        onChange={(e) => {
                                            setDestinationSearch(e.target.value)
                                            setCurrentPage(1)
                                        }}
                                    />
                                    <button 
                                        onClick={() => setShowAddDestination(!showAddDestination)}
                                        className="btn btn-square"
                                    >
                                        {showAddDestination ? <X size={20} /> : <Plus size={20} />}
                                    </button>
                                </div>

                                {showAddDestination && (
                                    <div className="bg-base-200 p-4 rounded-lg">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Nouvelle destination</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Nom*"
                                                className="input input-bordered"
                                                value={newDestinationName}
                                                onChange={(e) => setNewDestinationName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="form-control mt-2">
                                            <input
                                                type="text"
                                                placeholder="Description"
                                                className="input input-bordered"
                                                value={newDestinationDesc}
                                                onChange={(e) => setNewDestinationDesc(e.target.value)}
                                            />
                                        </div>
                                        <button 
                                            onClick={handleAddDestination}
                                            className="btn btn-primary mt-2 w-full"
                                        >
                                            Ajouter
                                        </button>
                                    </div>
                                )}

                                <select
                                    className="select select-bordered w-full"
                                    value={selectedDestinationId}
                                    onChange={(e) => {
                                        setSelectedDestinationId(e.target.value)
                                        setManualDestination("")
                                    }}
                                >
                                    <option value="">Sélectionnez une destination</option>
                                    {paginatedDestinations.map((dest) => (
                                        <option key={dest.id} value={dest.id}>
                                            {dest.name} {dest.description && `(${dest.description})`}
                                        </option>
                                    ))}
                                </select>

                                {filteredDestinations.length > DESTINATIONS_PER_PAGE && (
                                    <div className="flex justify-center gap-2">
                                        <button 
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="btn btn-sm"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="flex items-center px-4">
                                            Page {currentPage}
                                        </span>
                                        <button 
                                            onClick={() => setCurrentPage(p => 
                                                Math.min(
                                                    Math.ceil(filteredDestinations.length / DESTINATIONS_PER_PAGE), 
                                                    p + 1
                                                )
                                            )}
                                            disabled={currentPage * DESTINATIONS_PER_PAGE >= filteredDestinations.length}
                                            className="btn btn-sm"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}

                                <div className="divider">OU</div>

                                <div className="form-control">
                                    <input
                                        type="text"
                                        placeholder="Saisir une destination manuellement"
                                        className="input input-bordered"
                                        value={manualDestination}
                                        onChange={(e) => {
                                            setManualDestination(e.target.value)
                                            setSelectedDestinationId("")
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Tableau des produits */}
                            <div className="overflow-x-auto">
                                <table className='table w-full'>
                                    <thead>
                                        <tr>
                                            <th>Image</th>
                                            <th>Produit</th>
                                            <th>Quantité</th>
                                            <th>Unité</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.map((item) => (
                                            <tr key={item.productId}>
                                                <td>
                                                    <ProductImage
                                                        src={item.imageUrl}
                                                        alt={item.name}
                                                        heightClass='h-12'
                                                        widthClass='w-12'
                                                    />
                                                </td>
                                                <td>{item.name}</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        min="1"
                                                        max={item.availableQuantity}
                                                        className='input input-bordered w-20'
                                                        onChange={(e) => 
                                                            handleQuantityChange(item.productId, Number(e.target.value))
                                                        }
                                                    />
                                                </td>
                                                <td className='capitalize'>{item.unit}</td>
                                                <td>
                                                    <button
                                                        className='btn btn-sm btn-error'
                                                        onClick={() => handleRemoveFromCart(item.productId)}
                                                    >
                                                        <Trash size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Bouton de soumission */}
                            <button
                                onClick={handleSubmit}
                                className='btn btn-primary mt-4 w-full'
                                disabled={!selectedDestinationId && !manualDestination || isLoading}
                            >
                                {isLoading ? (
                                    <span className="loading loading-spinner"></span>
                                ) : (
                                    `Confirmer la sortie ${selectedDestinationId 
                                        ? `vers ${destinations.find(d => d.id === selectedDestinationId)?.name}`
                                        : manualDestination 
                                            ? `vers ${manualDestination}`
                                            : ''}`
                                )}
                            </button>
                        </>
                    ) : (
                        <EmptyState
                            message='Aucun produit dans le panier'
                            IconComponent='HandHeart'
                        />
                    )}
                </div>
            </div>
        </Wrapper>
    )
}

export default Page