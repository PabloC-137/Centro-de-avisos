import React, { useState } from 'react';
import {
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Check,
  Tag,
  AlertTriangle,
  Info
} from 'lucide-react';
import { NoticeCategory } from '../types';
import { NoticeService } from '../services/notice-service';

interface CategoriesManagerModalProps {
  tenantId: string;
  userId: string;
  categories: NoticeCategory[];
  onClose: () => void;
  onUpdated: () => void;
}

export function CategoriesManagerModal({
  tenantId,
  userId,
  categories,
  onClose,
  onUpdated
}: CategoriesManagerModalProps) {
  const [editingCat, setEditingCat] = useState<Partial<NoticeCategory> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('blue');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const startCreate = () => {
    setIsCreating(true);
    setEditingCat(null);
    setName('');
    setDescription('');
    setColor('blue');
    setNoticeMessage(null);
  };

  const startEdit = (cat: NoticeCategory) => {
    setEditingCat(cat);
    setIsCreating(false);
    setName(cat.name);
    setDescription(cat.description);
    setColor(cat.color || 'blue');
    setNoticeMessage(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      NoticeService.saveCategory(
        tenantId,
        {
          id: editingCat?.id,
          name: name.trim(),
          description: description.trim(),
          color
        },
        userId
      );
      setIsCreating(false);
      setEditingCat(null);
      onUpdated();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    NoticeService.reorderCategories(tenantId, newOrder.map(c => c.id));
    onUpdated();
  };

  const handleToggleActive = (cat: NoticeCategory) => {
    NoticeService.toggleCategoryStatus(tenantId, cat.id, !cat.is_active);
    onUpdated();
  };

  const handleDelete = (cat: NoticeCategory) => {
    const res = NoticeService.deleteCategory(tenantId, cat.id);
    setNoticeMessage(res.message);
    onUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full my-auto overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Tag className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Gestión de Categorías por Empresa
              </h2>
              <p className="text-xs text-slate-500">
                Creación, ordenamiento y desactivación segura sin pérdida histórica.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {noticeMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{noticeMessage}</span>
            </div>
          )}

          {/* Form when creating or editing */}
          {(isCreating || editingCat) ? (
            <form onSubmit={handleSave} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase">
                  {isCreating ? 'Nueva Categoría' : `Editar Categoría: ${editingCat?.name}`}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingCat(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Seguridad e Higiene"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Finalidad de los avisos agrupados..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Color Identificador
                </label>
                <div className="flex items-center gap-3">
                  {[
                    { id: 'blue', label: 'Azul' },
                    { id: 'emerald', label: 'Verde' },
                    { id: 'amber', label: 'Ámbar' },
                    { id: 'purple', label: 'Morado' },
                    { id: 'slate', label: 'Gris' }
                  ].map(c => (
                    <label key={c.id} className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="radio"
                        name="color"
                        value={c.id}
                        checked={color === c.id}
                        onChange={() => setColor(c.id)}
                        className="text-blue-600"
                      />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Guardar Categoría
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-500">
                Arrastra u ordena las categorías para determinar su prioridad visual en filtros.
              </p>
              <button
                type="button"
                onClick={startCreate}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Categoría</span>
              </button>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-2 divide-y divide-slate-100">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className={`pt-2 flex items-center justify-between gap-3 p-2 rounded-xl transition-colors ${
                  !cat.is_active ? 'opacity-50 bg-slate-100/60' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-20"
                      title="Mover arriba"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === categories.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-20"
                      title="Mover abajo"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">#{cat.order}</span>
                      {!cat.is_active && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-semibold">
                          Desactivada
                        </span>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(cat)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold border transition-colors ${
                      cat.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    {cat.is_active ? 'Activa' : 'Inactiva'}
                  </button>

                  <button
                    type="button"
                    onClick={() => startEdit(cat)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Eliminar (o desactivar si tiene comunicados)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
