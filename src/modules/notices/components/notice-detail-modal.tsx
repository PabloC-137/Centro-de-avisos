import React, { useState, useEffect } from 'react';
import {
  X,
  Pin,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  User,
  Clock,
  Download,
  FileText,
  FileSpreadsheet,
  File,
  History,
  MessageSquare,
  Send,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Lock,
  CornerDownRight
} from 'lucide-react';
import { Notice, NoticeAttachment, NoticeVersion, NoticeComment, AppUser } from '../types';
import { NoticeService, sanitizeHtml } from '../services/notice-service';

interface NoticeDetailModalProps {
  noticeId: string;
  tenantId: string;
  currentUser: AppUser;
  onClose: () => void;
  onNoticeUpdated?: () => void;
}

export function NoticeDetailModal({
  noticeId,
  tenantId,
  currentUser,
  onClose,
  onNoticeUpdated
}: NoticeDetailModalProps) {
  const [data, setData] = useState<{
    notice: Notice;
    attachments: NoticeAttachment[];
    versions: NoticeVersion[];
    comments: NoticeComment[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comments state
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Moderation state
  const [moderatingCommentId, setModeratingCommentId] = useState<string | null>(null);
  const [moderateReason, setModerateReason] = useState('');

  // Version selector
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // Download simulation toast
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);

  const loadDetail = () => {
    try {
      setLoading(true);
      setError(null);
      const res = NoticeService.getNoticeDetail(tenantId, noticeId, currentUser.id);
      setData(res);
      onNoticeUpdated(); // Synchronizes unread badges in parent/bell
    } catch (err: any) {
      setError(err.message || 'Error al cargar el comunicado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [noticeId, tenantId, currentUser.id]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !data) return;

    try {
      setIsSubmittingComment(true);
      NoticeService.addComment(tenantId, noticeId, newComment, currentUser);
      setNewComment('');
      loadDetail();
    } catch (err: any) {
      alert(err.message || 'No se pudo enviar el comentario');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleModerateComment = (commentId: string) => {
    if (!moderateReason.trim()) {
      alert('Debes indicar un motivo de moderación para la auditoría.');
      return;
    }
    try {
      NoticeService.moderateComment(tenantId, commentId, currentUser, moderateReason);
      setModeratingCommentId(null);
      setModerateReason('');
      loadDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDownloadAttachment = (attachment: NoticeAttachment) => {
    setDownloadMessage(`Descargando "${attachment.original_name}" de forma segura mediante canal autenticado de ${tenantId}...`);
    setTimeout(() => {
      setDownloadMessage(null);
      // Simulate file download by creating a virtual blob
      const blob = new Blob([`Contenido seguro de ${attachment.original_name}\nID Interno: ${attachment.internal_id}\nEmpresa: ${tenantId}\nFecha: ${new Date().toISOString()}`], {
        type: attachment.mime_type
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.original_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 900);
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-600" />;
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    if (['docx', 'doc'].includes(ext || '')) return <FileText className="w-5 h-5 text-blue-600" />;
    return <File className="w-5 h-5 text-slate-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">Cargando comunicado...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <h3 className="font-bold text-base">Restricción de Acceso</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">{error}</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { notice, attachments, versions, comments } = data;
  const isReadOnlyComments = notice.status === 'expired' || notice.status === 'archived';
  const canModerateComments = currentUser.permissions.includes('notices.moderate_comments');

  // If viewing a previous version snapshot
  const activeVersion = selectedVersionId ? versions.find(v => v.id === selectedVersionId) : null;
  const displayTitle = activeVersion ? activeVersion.title : notice.title;
  const displayHtml = activeVersion ? activeVersion.content_html : notice.content_html;
  const sanitizedDisplayHtml = sanitizeHtml(displayHtml);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-auto overflow-hidden flex flex-col max-h-[90vh]">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md transition-all"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cover Image */}
        {notice.cover_image_url && (
          <div className="relative w-full h-48 sm:h-56 bg-slate-100 shrink-0 overflow-hidden">
            <img
              src={notice.cover_image_url}
              alt={notice.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-white text-xs">
              <span className="font-semibold uppercase tracking-wider bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md">
                {notice.category?.name || 'Aviso'}
              </span>
              <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Leído: {notice.read_at ? new Date(notice.read_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : 'Ahora'}
              </span>
            </div>
          </div>
        )}

        {/* Scrollable Container */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-6">
          {/* Header Metadata */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {notice.is_pinned && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                  <Pin className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
                  Aviso Fijado
                </span>
              )}

              {notice.priority === 'critical' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Prioridad Crítica
                </span>
              )}

              {notice.priority === 'important' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Prioridad Importante
                </span>
              )}

              {notice.priority === 'normal' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <Info className="w-3.5 h-3.5" />
                  Prioridad Normal
                </span>
              )}

              {notice.status === 'expired' && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                  Expirado (Historial)
                </span>
              )}

              {notice.status === 'archived' && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-300">
                  Archivado
                </span>
              )}

              {/* Version pill */}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <History className="w-3 h-3" />
                v{activeVersion ? activeVersion.version_number : notice.version} {activeVersion && '(Histórico)'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {displayTitle}
            </h1>

            {/* Author and Date Strip */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <User className="w-4 h-4 text-slate-400" />
                <span>{notice.author_name} ({notice.author_role})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Publicado: {new Date(notice.publish_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              {notice.expire_at && (
                <div className="flex items-center gap-1.5 text-amber-700">
                  <Clock className="w-4 h-4" />
                  <span>Vigente hasta: {new Date(notice.expire_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>
                </div>
              )}
            </div>

            {/* Version History Selector Banner if versions exist */}
            {versions.length > 0 && (
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <History className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold">Historial de Versiones:</span>
                  <span>Este comunicado cuenta con {versions.length + 1} versiones registradas.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedVersionId(null)}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      selectedVersionId === null ? 'bg-blue-600 text-white' : 'bg-white hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Versión Vigente (v{notice.version})
                  </button>
                  {versions.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVersionId(v.id)}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        selectedVersionId === v.id ? 'bg-blue-600 text-white' : 'bg-white hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      v{v.version_number} ({v.change_notes || 'Revisión'})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* HTML Sanitized Content */}
          <div className="pt-6">
            <div
              className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizedDisplayHtml }}
            />
          </div>

          {/* Attachments Section */}
          <div className="pt-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Documentos y Adjuntos Protegidos ({attachments.length})</span>
            </h3>

            {downloadMessage && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2 animate-pulse">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{downloadMessage}</span>
              </div>
            )}

            {attachments.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No hay archivos adjuntos en este comunicado.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getFileIcon(att.original_name)}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate" title={att.original_name}>
                          {att.original_name}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {formatFileSize(att.file_size)} • Token autenticado
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadAttachment(att)}
                      className="shrink-0 p-1.5 bg-white hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg border border-slate-200 transition-colors shadow-xs"
                      title="Descargar archivo autenticado"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <span>Comentarios del Personal ({comments.length})</span>
              </h3>
              {!notice.allow_comments && (
                <span className="text-xs text-slate-400 font-medium">Comentarios desactivados</span>
              )}
            </div>

            {notice.allow_comments ? (
              <div className="space-y-4">
                {/* Notice expired or archived banner */}
                {isReadOnlyComments && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    Este comunicado se encuentra en estado <strong>{notice.status}</strong>. Los comentarios se conservan en modo de solo lectura.
                  </div>
                )}

                {/* New Comment Input */}
                {!isReadOnlyComments && (
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escribe una consulta o confirmación sobre este aviso..."
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Comentar</span>
                    </button>
                  </form>
                )}

                {/* Moderation reason dialog */}
                {moderatingCommentId && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                    <p className="text-xs font-semibold text-rose-900 flex items-center gap-1.5">
                      <EyeOff className="w-3.5 h-3.5" />
                      Ocultar comentario por moderación interna
                    </p>
                    <input
                      type="text"
                      value={moderateReason}
                      onChange={(e) => setModerateReason(e.target.value)}
                      placeholder="Motivo requerido de moderación (ej. lenguaje no permitido, dato erróneo)..."
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-rose-300 bg-white"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setModeratingCommentId(null);
                          setModerateReason('');
                        }}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:bg-rose-100 rounded"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModerateComment(moderatingCommentId)}
                        className="px-3 py-1 text-xs font-semibold bg-rose-600 text-white rounded hover:bg-rose-700"
                      >
                        Confirmar Ocultamiento
                      </button>
                    </div>
                  </div>
                )}

                {/* Comments Stream */}
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Aún no hay comentarios en este comunicado.</p>
                  ) : (
                    comments.map((comm) => (
                      <div
                        key={comm.id}
                        className={`p-3 rounded-xl border text-xs ${
                          comm.is_hidden
                            ? 'bg-rose-50/50 border-rose-200 text-rose-800'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            {comm.user_avatar ? (
                              <img src={comm.user_avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">
                                {comm.user_name.charAt(0)}
                              </div>
                            )}
                            <span className="font-semibold text-slate-900">{comm.user_name}</span>
                            <span className="text-[10px] text-slate-500">({comm.user_role})</span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{new Date(comm.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            {canModerateComments && !comm.is_hidden && (
                              <button
                                type="button"
                                onClick={() => setModeratingCommentId(comm.id)}
                                className="text-rose-600 hover:text-rose-800 font-medium hover:underline flex items-center gap-0.5 ml-2"
                                title="Ocultar con registro de auditoría"
                              >
                                <EyeOff className="w-3 h-3" />
                                Moderar
                              </button>
                            )}
                          </div>
                        </div>

                        {comm.is_hidden ? (
                          <div className="text-[11px] text-rose-700 italic flex items-start gap-1">
                            <CornerDownRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                            <span>
                              [Comentario ocultado por {comm.hidden_by} el {new Date(comm.hidden_at!).toLocaleDateString('es-MX')}]. Motivo: "{comm.hidden_reason}".
                            </span>
                          </div>
                        ) : (
                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {comm.content}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                El emisor ha configurado este comunicado sin opción de comentarios.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Aislamiento por empresa verificado ({tenantId})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl transition-colors"
          >
            Cerrar Comunicado
          </button>
        </div>
      </div>
    </div>
  );
}
