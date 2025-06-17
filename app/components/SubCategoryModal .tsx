import React from 'react'

interface SubCategoryModalProps {
  title: string;
  name: string;
  description: string;
  loading: boolean;
  onClose: () => void;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onSubmit: () => void | Promise<void>;
}

const SubCategoryModal: React.FC<SubCategoryModalProps> = ({
  title,
  name,
  description,
  loading,
  onClose,
  onChangeName,
  onChangeDescription,
  onSubmit
}) => {
  return (
    <dialog id="subcategory_modal" className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{title}</h3>
        
        <div className="py-4 space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Nom</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => onChangeName(e.target.value)}
              className="input input-bordered w-full"
              placeholder="Nom de la sous-catégorie"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <input
              value={description}
              onChange={(e) => onChangeDescription(e.target.value)}
              className="input input-bordered  w-full"
              placeholder="Description (facultative)"
            />
          </div>
        </div>

        <div className="modal-action">
          <button className="btn" onClick={onClose} disabled={loading}>
            Annuler
          </button>
          <button 
            className="btn btn-primary" 
            onClick={onSubmit}
            disabled={loading || !name.trim()}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default SubCategoryModal
