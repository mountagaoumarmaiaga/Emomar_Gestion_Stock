import React from 'react'

interface Props {
    title: string;
    name: string,
    description: string,
    loading: boolean,
    onClose: () => void,
    onChangeName: (value: string) => void,
    onChangeDescription: (value: string) => void,
    onSubmit: () => void,
    editMode?: boolean
}

const CategoryModal: React.FC<Props> = ({
    name, description, loading, onClose, onChangeDescription, onChangeName, editMode, onSubmit
}) => {
    return (
        <dialog id="category_modal" className="modal">
            <div className="modal-box">
                <form method="dialog">
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </form>
                <h3 className="font-bold text-lg mb-4">
                    {editMode ? "Modifier la catégorie" : "Nouvelle catégorie"}
                </h3>
                <input
                    type="text"
                    placeholder='Nom'
                    value={name}
                    onChange={(e) => onChangeName(e.target.value)}
                    className='input input-bordered w-full mb-4'
                />
                <input
                    type="text"
                    placeholder='Description'
                    value={description}
                    onChange={(e) => onChangeDescription(e.target.value)}
                    className='input input-bordered w-full mb-4'
                />

                <button
                    className='btn btn-primary'
                    onClick={onSubmit}
                    disabled={loading}
                >
                    {loading
                        ? editMode
                            ? "Modification..."
                            : "Ajout..."
                        : editMode
                            ? "Modifier"
                            : "Ajouter"
                    }
                </button>

            </div>
        </dialog>
    )
}

export default CategoryModal
