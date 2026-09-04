import React, { useState, useMemo } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Upload,
  FileText,
  FileSpreadsheet,
  File,
  Trash2,
  Image as ImageIcon,
  Users,
  ShieldAlert,
  AlertCircle,
  Calendar,
  Clock,
  Pin,
  CheckCircle2,
  Send,
  Save,
  AlertTriangle,
  Search
} from 'lucide-react';
import {
  Notice,
  NoticeCategory,
  NoticePriority,
  NoticeAudienceCriteria,
  AppUser,
  AppRole,
  AppBranch
} from '../types';
import { NoticeService, validateAttachmentFile } from '../services/notice-service';
import { RichTextEditor } from '../../../components/rich-text-editor';
import { getDatabase } from '../services/storage';

interface NoticeEditorWizardProps {
  initialNotice?: Notice | null;
  tenantId: string;
  currentUser: AppUser;
  categories: NoticeCategory[];
  roles: AppRole[];
  branches: AppBranch[];
  allUsers: AppUser[];
  onClose: () => void;
  onSaved: () => void;
}

interface StagedAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  isCover: boolean;
  dataUrl?: string;
  isExisting?: boolean;
}

export function NoticeEditorWizard({
  initialNotice,
  tenantId,
  currentUser,
  categories,
  roles,
  branches,
  allUsers,
  onClose,
  onSaved
}: NoticeEditorWizardProps) {
  const isEditing = !!initialNotice;
  const isPublishedEdit = isEditing && (initialNotice.status === 'published' || initialNotice.status === 'expired');

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [title, setTitle] = useState(initialNotice?.title || '');
  const [summary, setSummary] = useState(initialNotice?.summary || '');
  const [contentHtml, setContentHtml] = useState(
    initialNotice?.content_html || '<h2>Novedades y Lineamientos</h2><p>Estimado equipo:</p><p>Favor de revisar el siguiente comunicado corporativo.</p>'
  );
  const [categoryId, setCategoryId] = useState(initialNotice?.category_id || (categories[0]?.id || ''));
  const [priority, setPriority] = useState<NoticePriority>(initialNotice?.priority || 'normal');
  const [isPinned, setIsPinned] = useState(initialNotice?.is_pinned || false);
  const [allowComments, setAllowComments] = useState(initialNotice?.allow_comments || false);

  // Scheduling & Dates
  const [publishImmediately, setPublishImmediately] = useState(!initialNotice || initialNotice.status === 'published');
  const [publishAt, setPublishAt] = useState(
    initialNotice?.publish_at ? initialNotice.publish_at.substring(0, 16) : new Date().toISOString().substring(0, 16)
  );
  const [hasExpiration, setHasExpiration] = useState(!!initialNotice?.expire_at);
  const [expireAt, setExpireAt] = useState(
    initialNotice?.expire_at
      ? initialNotice.expire_at.substring(0, 16)
      : new Date(Date.now() + 15 * 86400000).toISOString().substring(0, 16)
  );

  // Versioning options when editing published notice
  const [changeNotes, setChangeNotes] = useState('');
  const [reNotifyRecipients, setReNotifyRecipients] = useState(false);

  // Attachments State
  const [attachments, setAttachments] = useState<StagedAttachment[]>(() => {
    if (!initialNotice) return [];
    const db = getDatabase();
    return db.attachments
      .filter(a => a.notice_id === initialNotice.id && a.tenant_id === tenantId)
      .map(a => ({
        id: a.id,
        name: a.original_name,
        size: a.file_size,
        mimeType: a.mime_type,
        isCover: a.is_cover,
        isExisting: true
      }));
  });

  const [coverImageUrl, setCoverImageUrl] = useState(initialNotice?.cover_image_url || '');

  // Audience State
  const [audienceType, setAudienceType] = useState<'all' | 'segmented'>(
    initialNotice?.audience_criteria?.type || 'all'
  );
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    initialNotice?.audience_criteria?.roles || []
  );
  const [selectedBranches, setSelectedBranches] = useState<string[]>(
    initialNotice?.audience_criteria?.branches || []
  );
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    initialNotice?.audience_criteria?.specific_user_ids || []
  );

  // Audience Preview Search & Pagination
  const [audienceSearch, setAudienceSearch] = useState('');
  const [previewPage, setPreviewPage] = useState(1);
  const pageSize = 5;

  // File Upload Error
  const [fileError, setFileError] = useState<string | null>(null);

  // Calculate live audience preview
  const audienceCriteria: NoticeAudienceCriteria = useMemo(() => ({
    type: audienceType,
    roles: selectedRoles,
    branches: selectedBranches,
    specific_user_ids: selectedUserIds
  }), [audienceType, selectedRoles, selectedBranches, selectedUserIds]);

  const audiencePreview = useMemo(() => {
    return NoticeService.calculateAudience(tenantId, audienceCriteria);
  }, [tenantId, audienceCriteria]);

  const filteredPreviewUsers = useMemo(() => {
    if (!audienceSearch) return audiencePreview.users;
    const s = audienceSearch.toLowerCase();
    return audiencePreview.users.filter(u =>
      u.name.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.role_label.toLowerCase().includes(s) ||
      (u.branch_name && u.branch_name.toLowerCase().includes(s))
    );
  }, [audiencePreview.users, audienceSearch]);

  const totalPages = Math.ceil(filteredPreviewUsers.length / pageSize) || 1;
  const paginatedUsers = filteredPreviewUsers.slice((previewPage - 1) * pageSize, previewPage * pageSize);

  // File Add Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > 5) {
      setFileError('Límite alcanzado: Máximo 5 archivos por aviso en total (incluyendo portada).');
      return;
    }

    const newItems: StagedAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateAttachmentFile(file.name, file.size);
      if (!validation.valid) {
        setFileError(validation.error || 'Archivo rechazado.');
        return;
      }

      newItems.push({
        id: `stage-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        mimeType: file.type || `application/${validation.extension}`,
        isCover: attachments.length === 0 && i === 0 && !coverImageUrl,
        isExisting: false
      });
    }

    setAttachments([...attachments, ...newItems]);
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const toggleCover = (id: string) => {
    setAttachments(attachments.map(a => ({
      ...a,
      isCover: a.id === id ? !a.isCover : false
    })));
  };

  // Submit Handler
  const handleSave = (asDraft: boolean) => {
    if (!title.trim()) {
      alert('El aviso requiere un título.');
      return;
    }
    if (!categoryId) {
      alert('Debes seleccionar una categoría.');
      return;
    }
    if (audiencePreview.total_count === 0 && !asDraft) {
      alert('La audiencia calculada es 0 destinatarios. Selecciona al menos un rol, sucursal o usuario.');
      return;
    }

    try {
      // Find cover
      const coverAtt = attachments.find(a => a.isCover);
      const coverUrl = coverImageUrl || (coverAtt ? 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80' : undefined);

      if (asDraft) {
        const draft = NoticeService.saveAsDraft(
          tenantId,
          {
            id: initialNotice?.id,
            title,
            summary,
            content_html: contentHtml,
            category_id: categoryId,
            priority,
            is_pinned: isPinned,
            expire_at: hasExpiration ? new Date(expireAt).toISOString() : null,
            allow_comments: allowComments,
            audience_criteria: audienceCriteria,
            cover_image_url: coverUrl
          },
          currentUser
        );

        // Sync attachments
        syncAttachmentsToDb(draft.id);
        onSaved();
      } else {
        const pubDateIso = publishImmediately ? new Date().toISOString() : new Date(publishAt).toISOString();
        const expDateIso = hasExpiration ? new Date(expireAt).toISOString() : null;

        const saved = NoticeService.saveNotice(
          tenantId,
          {
            id: initialNotice?.id,
            title,
            summary,
            content_html: contentHtml,
            category_id: categoryId,
            priority,
            is_pinned: isPinned,
            publish_at: pubDateIso,
            expire_at: expDateIso,
            allow_comments: allowComments,
            audience_criteria: audienceCriteria,
            cover_image_url: coverUrl,
            cover_attachment_id: coverAtt?.id,
            publish_immediately: publishImmediately,
            re_notify_recipients: reNotifyRecipients,
            change_notes: changeNotes
          },
          currentUser
        );

        syncAttachmentsToDb(saved.id);
        onSaved();
      }
    } catch (err: any) {
      alert(err.message || 'Error al guardar el comunicado.');
    }
  };

  const syncAttachmentsToDb = (noticeId: string) => {
    // Only upload non-existing staged files
    attachments.forEach(a => {
      if (!a.isExisting) {
        NoticeService.addAttachment(tenantId, noticeId, {
          name: a.name,
          size: a.size,
          mimeType: a.mimeType,
          isCover: a.isCover
        });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {step}/3
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {isEditing ? (isPublishedEdit ? `Editar Comunicado Publicado (v${initialNotice.version + 1})` : 'Editar Borrador') : 'Redactar Nuevo Comunicado'}
              </h2>
              <p className="text-xs text-slate-500">
                {step === 1 && 'Paso 1: Parámetros generales, categoría y programación'}
                {step === 2 && 'Paso 2: Redacción de contenido enriquecido y archivos adjuntos'}
                {step === 3 && 'Paso 3: Audiencia, segmentación con vista previa y publicación'}
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

        {/* Steps Progress Bar */}
        <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-200 text-xs font-medium text-center">
          <button
            onClick={() => setStep(1)}
            className={`py-2 px-3 border-b-2 transition-colors ${
              step === 1 ? 'border-blue-600 text-blue-700 bg-white font-semibold' : 'border-transparent text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            1. Información & Vigencia
          </button>
          <button
            onClick={() => setStep(2)}
            className={`py-2 px-3 border-b-2 transition-colors ${
              step === 2 ? 'border-blue-600 text-blue-700 bg-white font-semibold' : 'border-transparent text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            2. Contenido & Adjuntos ({attachments.length}/5)
          </button>
          <button
            onClick={() => setStep(3)}
            className={`py-2 px-3 border-b-2 transition-colors ${
              step === 3 ? 'border-blue-600 text-blue-700 bg-white font-semibold' : 'border-transparent text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            3. Audiencia ({audiencePreview.total_count}) & Publicación
          </button>
        </div>

        {/* Wizard Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: General Info */}
          {step === 1 && (
            <div className="space-y-5">
              {isPublishedEdit && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Aviso actualmente publicado</strong>
                    Al guardar cambios, se creará una versión histórica inmutable (v{initialNotice.version}) que preservará el contenido anterior y sus adjuntos. La audiencia original no puede ampliarse; para nuevos destinatarios duplica el aviso.
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Título del Comunicado <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Nuevo Protocolo de Apertura y Manejo de Efectivo 2026"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Resumen Ejecutivo (Aparece en feeds y campana de alertas) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Describe brevemente el objetivo y alcance del comunicado en 1 o 2 oraciones..."
                  rows={2}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Category, Priority, Pin Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 bg-white"
                  >
                    {categories.filter(c => c.is_active || c.id === categoryId).map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} {!cat.is_active && '(Inactiva)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Prioridad Visual
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as NoticePriority)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="normal">Normal (Estándar)</option>
                    <option value="important">Importante (Resaltado ámbar)</option>
                    <option value="critical">Crítico (Alerta roja prioritaria)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Fijar en Feed
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-300 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <Pin className="w-4 h-4 text-amber-600" />
                    <span>Fijar arriba de todo</span>
                  </label>
                </div>
              </div>

              {/* Comments & Cover URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Habilitar Comentarios Internos</span>
                      <span className="text-[11px] text-slate-500">
                        Desactivado por defecto. Solo destinatarios podrán comentar.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowComments}
                      onChange={(e) => setAllowComments(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    URL Imagen de Portada (Opcional)
                  </label>
                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Publication Date & Expiration */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Programación y Vigencia (Zona horaria de la empresa)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Fecha y Hora de Publicación</span>
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={publishImmediately}
                          onChange={(e) => setPublishImmediately(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>Publicar de inmediato al finalizar</span>
                      </label>
                      {!publishImmediately && (
                        <input
                          type="datetime-local"
                          value={publishAt}
                          onChange={(e) => setPublishAt(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>Fecha de Expiración</span>
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={hasExpiration}
                          onChange={(e) => setHasExpiration(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>Establecer vigencia límite</span>
                      </label>
                      {hasExpiration && (
                        <input
                          type="datetime-local"
                          value={expireAt}
                          onChange={(e) => setExpireAt(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* If editing published notice: version change notes */}
              {isPublishedEdit && (
                <div className="pt-3 border-t border-slate-200 space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <h4 className="text-xs font-bold text-blue-900 uppercase">
                    Control de Versión y Notificación de Actualización
                  </h4>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Notas de los cambios realizados en esta versión:
                    </label>
                    <input
                      type="text"
                      value={changeNotes}
                      onChange={(e) => setChangeNotes(e.target.value)}
                      placeholder="Ej: Se corrigieron los montos de arqueo en punto 2..."
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-800 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reNotifyRecipients}
                      onChange={(e) => setReNotifyRecipients(e.target.checked)}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <span>Re-enviar alerta en campana y marcar como pendiente de leer para los destinatarios existentes</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Content & Attachments */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Rich Text Editor */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Cuerpo del Comunicado (Editor Enriquecido) <span className="text-red-500">*</span>
                </label>
                <RichTextEditor value={contentHtml} onChange={setContentHtml} />
              </div>

              {/* Attachments Manager */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Archivos y Adjuntos Protegidos ({attachments.length}/5)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Formatos permitidos: JPG, PNG, WebP, PDF, DOCX, XLSX, PPTX. Máx 10 MB por archivo.
                    </p>
                  </div>

                  <label className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-blue-200 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Agregar Archivo</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.xlsx,.pptx"
                    />
                  </label>
                </div>

                {fileError && (
                  <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{fileError}</span>
                  </div>
                )}

                {attachments.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                    No has agregado archivos adjuntos a este aviso. Puedes añadir hasta 5 documentos o imágenes.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 truncate block">
                              {att.name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {(att.size / 1024).toFixed(0)} KB • Identificador interno protegido
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleCover(att.id)}
                            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                              att.isCover
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'hover:bg-slate-200 text-slate-600'
                            }`}
                            title="Usar como portada principal"
                          >
                            <ImageIcon className="w-3 h-3" />
                            {att.isCover ? 'Es Portada' : 'Hacer Portada'}
                          </button>

                          <button
                            type="button"
                            onClick={() => removeAttachment(att.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                            title="Eliminar archivo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Audience & Preview */}
          {step === 3 && (
            <div className="space-y-6">
              {isPublishedEdit ? (
                <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-700 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Audiencia Congelada e Inmutable</span>
                  </div>
                  <p>
                    De acuerdo con las reglas de negocio, la lista de destinatarios de un comunicado publicado queda congelada de manera permanente para garantizar trazabilidad de lectura y auditoría.
                  </p>
                  <p className="font-semibold">
                    Total de destinatarios congelados: {initialNotice.frozen_recipients_count || audiencePreview.total_count} personas.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Selección de Destinatarios Permitidos
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          audienceType === 'all'
                            ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="audienceType"
                          checked={audienceType === 'all'}
                          onChange={() => setAudienceType('all')}
                          className="mt-0.5 text-blue-600"
                        />
                        <div>
                          <strong className="block text-xs font-bold text-slate-900">
                            Todo el Personal Interno Activo
                          </strong>
                          <span className="text-[11px] text-slate-500">
                            Se enviará a todos los colaboradores activos de la empresa ({allUsers.filter(u => u.is_internal && u.is_active && u.tenant_id === tenantId).length} colaboradores). Se excluyen clientes.
                          </span>
                        </div>
                      </label>

                      <label
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          audienceType === 'segmented'
                            ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="audienceType"
                          checked={audienceType === 'segmented'}
                          onChange={() => setAudienceType('segmented')}
                          className="mt-0.5 text-blue-600"
                        />
                        <div>
                          <strong className="block text-xs font-bold text-slate-900">
                            Segmentación por Rol, Sucursal o Usuarios
                          </strong>
                          <span className="text-[11px] text-slate-500">
                            Aplica intersección si seleccionas roles y sucursales (ej. personal de cajas en Polanco).
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {audienceType === 'segmented' && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                      {/* Roles selection */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          1. Filtrar por Roles (Opcional):
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {roles.map(r => {
                            const isSelected = selectedRoles.includes(r.id);
                            return (
                              <button
                                type="button"
                                key={r.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedRoles(selectedRoles.filter(x => x !== r.id));
                                  } else {
                                    setSelectedRoles([...selectedRoles, r.id]);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {r.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Branches selection */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          2. Filtrar por Sucursales (Opcional):
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {branches.map(b => {
                            const isSelected = selectedBranches.includes(b.id);
                            return (
                              <button
                                type="button"
                                key={b.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedBranches(selectedBranches.filter(x => x !== b.id));
                                  } else {
                                    setSelectedBranches([...selectedBranches, b.id]);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {b.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-800">
                        <strong>Lógica de Intersección:</strong> Si marcas roles y sucursales, solo los usuarios que tengan alguno de los roles marcados Y pertenezcan a alguna de las sucursales marcadas recibirán el aviso.
                      </div>

                      {/* Specific Users */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          3. Agregar Usuarios Concretos Adicionales (Unión):
                        </label>
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-lg">
                          {allUsers
                            .filter(u => u.tenant_id === tenantId && u.is_internal && u.is_active)
                            .map(u => {
                              const isSelected = selectedUserIds.includes(u.id);
                              return (
                                <button
                                  type="button"
                                  key={u.id}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedUserIds(selectedUserIds.filter(x => x !== u.id));
                                    } else {
                                      setSelectedUserIds([...selectedUserIds, u.id]);
                                    }
                                  }}
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                                    isSelected
                                      ? 'bg-purple-600 text-white border-purple-600'
                                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                  }`}
                                >
                                  {u.name} ({u.role_label})
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LIVE AUDIENCE PREVIEW TABLE */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Vista Previa de Destinatarios ({audiencePreview.total_count} confirmados)
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        value={audienceSearch}
                        onChange={(e) => {
                          setAudienceSearch(e.target.value);
                          setPreviewPage(1);
                        }}
                        placeholder="Buscar destinatario..."
                        className="pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-300 w-40 sm:w-48 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {audiencePreview.total_count === 0 ? (
                  <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center text-amber-800 text-xs">
                    Ningún usuario cumple con la combinación actual de roles y sucursales seleccionadas.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                      <thead className="bg-slate-50 font-semibold text-slate-600">
                        <tr>
                          <th className="px-3 py-2">Colaborador</th>
                          <th className="px-3 py-2">Rol Interno</th>
                          <th className="px-3 py-2">Sucursal / Ubicación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedUsers.map(user => (
                          <tr key={user.id} className="hover:bg-slate-50/70">
                            <td className="px-3 py-2">
                              <div className="font-semibold text-slate-900">{user.name}</div>
                              <div className="text-[10px] text-slate-400">{user.email}</div>
                            </td>
                            <td className="px-3 py-2 text-slate-600">{user.role_label}</td>
                            <td className="px-3 py-2 text-slate-600">{user.branch_name || 'Sin asignar'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                        <span>Página {previewPage} de {totalPages}</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={previewPage <= 1}
                            onClick={() => setPreviewPage(p => p - 1)}
                            className="px-2 py-0.5 rounded border bg-white disabled:opacity-40"
                          >
                            Anterior
                          </button>
                          <button
                            type="button"
                            disabled={previewPage >= totalPages}
                            onClick={() => setPreviewPage(p => p + 1)}
                            className="px-2 py-0.5 rounded border bg-white disabled:opacity-40"
                          >
                            Siguiente
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Paso Anterior</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-semibold"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Borrador</span>
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !title.trim()) {
                    alert('Por favor ingresa un título para continuar.');
                    return;
                  }
                  setStep((s) => (s + 1) as any);
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Continuar</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSave(false)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>{publishImmediately ? 'Confirmar y Publicar Ahora' : 'Programar Publicación'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
