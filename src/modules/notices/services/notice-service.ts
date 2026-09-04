import {
  Notice,
  NoticeCategory,
  NoticeAttachment,
  NoticeVersion,
  NoticeRecipient,
  NoticeComment,
  NoticeNotification,
  NoticeMetrics,
  AppUser,
  NoticeAudienceCriteria
} from '../types';
import { getDatabase, saveDatabase } from './storage';

// HTML Sanitization utility (Backend simulation)
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  // Strip harmful tags: <script>, <iframe>, <object>, <embed>, event handlers like onload, onclick, onerror
  let sanitized = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\son\w+=\w+/gi, '')
    .replace(/javascript:[^"']*/gi, '#unsafe-script-blocked');
  return sanitized;
}

// File Validation Specs
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'docx', 'xlsx', 'pptx'];
const FORBIDDEN_EXTENSIONS = ['svg', 'html', 'htm', 'exe', 'bat', 'sh', 'docm', 'xlsm', 'pptm', 'js', 'vbs'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_ATTACHMENTS_PER_NOTICE = 5;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  extension?: string;
}

export function validateAttachmentFile(filename: string, sizeBytes: number): FileValidationResult {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (FORBIDDEN_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Formato prohibido: Archivos .${ext} (SVG, ejecutables, HTML o documentos con macros) están estrictamente restringidos por seguridad corporativa.`
    };
  }

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Formato no soportado (.${ext}). Solo se permiten: JPG, PNG, WebP, PDF, DOCX, XLSX y PPTX.`
    };
  }

  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `El archivo supera el límite máximo permitido de 10 MB (${(sizeBytes / (1024 * 1024)).toFixed(1)} MB).`
    };
  }

  return { valid: true, extension: ext };
}

export class NoticeService {
  // 1. Categories Management
  static getCategories(tenantId: string): NoticeCategory[] {
    const db = getDatabase();
    return db.categories
      .filter(c => c.tenant_id === tenantId)
      .sort((a, b) => a.order - b.order);
  }

  static saveCategory(tenantId: string, payload: Partial<NoticeCategory>, userId: string): NoticeCategory {
    const db = getDatabase();
    const now = new Date().toISOString();

    if (payload.id) {
      // Edit
      const idx = db.categories.findIndex(c => c.id === payload.id && c.tenant_id === tenantId);
      if (idx === -1) throw new Error('Categoría no encontrada');
      db.categories[idx] = {
        ...db.categories[idx],
        ...payload,
        updated_at: now
      };
      saveDatabase(db);
      return db.categories[idx];
    } else {
      // Create new
      const maxOrder = db.categories.filter(c => c.tenant_id === tenantId).reduce((m, c) => Math.max(m, c.order), 0);
      const newCat: NoticeCategory = {
        id: `cat-${Date.now()}`,
        tenant_id: tenantId,
        name: payload.name || 'Nueva Categoría',
        slug: (payload.name || 'nueva-categoria').toLowerCase().replace(/\s+/g, '-'),
        description: payload.description || '',
        color: payload.color || 'blue',
        icon: payload.icon || 'tag',
        order: maxOrder + 1,
        is_active: true,
        created_at: now,
        updated_at: now
      };
      db.categories.push(newCat);
      saveDatabase(db);
      return newCat;
    }
  }

  static reorderCategories(tenantId: string, categoryIdsInOrder: string[]): NoticeCategory[] {
    const db = getDatabase();
    categoryIdsInOrder.forEach((id, index) => {
      const cat = db.categories.find(c => c.id === id && c.tenant_id === tenantId);
      if (cat) {
        cat.order = index + 1;
        cat.updated_at = new Date().toISOString();
      }
    });
    saveDatabase(db);
    return this.getCategories(tenantId);
  }

  static toggleCategoryStatus(tenantId: string, categoryId: string, isActive: boolean): NoticeCategory {
    const db = getDatabase();
    const cat = db.categories.find(c => c.id === categoryId && c.tenant_id === tenantId);
    if (!cat) throw new Error('Categoría no encontrada');
    cat.is_active = isActive;
    cat.updated_at = new Date().toISOString();
    saveDatabase(db);
    return cat;
  }

  static deleteCategory(tenantId: string, categoryId: string): { success: boolean; message: string } {
    const db = getDatabase();
    // Rule: Las categorías utilizadas no se eliminan físicamente
    const isUsed = db.notices.some(n => n.tenant_id === tenantId && n.category_id === categoryId);
    if (isUsed) {
      // Auto-deactivate instead of physical delete
      const cat = db.categories.find(c => c.id === categoryId && c.tenant_id === tenantId);
      if (cat) {
        cat.is_active = false;
        saveDatabase(db);
        return {
          success: true,
          message: 'La categoría está asociada a avisos existentes y no puede eliminarse físicamente; ha sido desactivada para evitar su uso en nuevos comunicados.'
        };
      }
    }

    db.categories = db.categories.filter(c => !(c.id === categoryId && c.tenant_id === tenantId));
    saveDatabase(db);
    return { success: true, message: 'Categoría eliminada con éxito.' };
  }

  // 2. Audience Calculation and Preview
  static calculateAudience(tenantId: string, criteria: NoticeAudienceCriteria): {
    total_count: number;
    users: AppUser[];
  } {
    const db = getDatabase();
    // Rule: Destinatarios permitidos: todo el personal interno activo; se excluyen cuentas de clientes.
    const allInternalUsers = db.users.filter(u => u.tenant_id === tenantId && u.is_internal && u.is_active);

    if (criteria.type === 'all') {
      return {
        total_count: allInternalUsers.length,
        users: allInternalUsers
      };
    }

    const hasRoles = criteria.roles && criteria.roles.length > 0;
    const hasBranches = criteria.branches && criteria.branches.length > 0;
    const specificUserIds = new Set(criteria.specific_user_ids || []);

    const matchedUsers = allInternalUsers.filter(user => {
      // Rule: Si se seleccionan roles y sucursales, aplicar intersección: usuarios con alguno de los roles elegidos dentro de alguna sucursal elegida.
      let matchesSegment = false;
      if (hasRoles && hasBranches) {
        matchesSegment = criteria.roles.includes(user.role) && (user.branch_id ? criteria.branches.includes(user.branch_id) : false);
      } else if (hasRoles) {
        matchesSegment = criteria.roles.includes(user.role);
      } else if (hasBranches) {
        matchesSegment = user.branch_id ? criteria.branches.includes(user.branch_id) : false;
      }

      // Rule: Los usuarios seleccionados individualmente se agregan aparte (unión).
      const matchesSpecific = specificUserIds.has(user.id);

      return matchesSegment || matchesSpecific;
    });

    return {
      total_count: matchedUsers.length,
      users: matchedUsers
    };
  }

  // 3. Scheduler Runner (Idempotent background simulation)
  static runScheduler(tenantId: string): { publishedCount: number; expiredCount: number } {
    const db = getDatabase();
    const now = new Date();
    let publishedCount = 0;
    let expiredCount = 0;

    db.notices.forEach(notice => {
      if (notice.tenant_id !== tenantId) return;

      // Check scheduled -> published
      if (notice.status === 'scheduled') {
        const pubDate = new Date(notice.publish_at);
        if (pubDate <= now) {
          notice.status = 'published';
          notice.updated_at = now.toISOString();
          publishedCount++;

          // Freeze recipients if not already frozen
          this._freezeRecipientsInternal(db, notice);
        }
      }

      // Check published -> expired
      if (notice.status === 'published' && notice.expire_at) {
        const expDate = new Date(notice.expire_at);
        if (expDate <= now) {
          notice.status = 'expired';
          notice.updated_at = now.toISOString();
          expiredCount++;
        }
      }
    });

    if (publishedCount > 0 || expiredCount > 0) {
      saveDatabase(db);
    }

    return { publishedCount, expiredCount };
  }

  // Helper to freeze recipients in DB
  private static _freezeRecipientsInternal(db: ReturnType<typeof getDatabase>, notice: Notice): void {
    const audience = this.calculateAudience(notice.tenant_id, notice.audience_criteria);
    const now = new Date().toISOString();

    // Check if recipients already exist (idempotent)
    const existingRecipients = db.recipients.filter(r => r.notice_id === notice.id);
    if (existingRecipients.length === 0) {
      const newRecipients: NoticeRecipient[] = audience.users.map(u => ({
        id: `rec-${notice.id}-${u.id}`,
        notice_id: notice.id,
        user_id: u.id,
        user_name: u.name,
        user_email: u.email,
        user_role: u.role_label,
        user_branch: u.branch_name,
        tenant_id: notice.tenant_id,
        delivered_at: now,
        read_at: null
      }));
      db.recipients.push(...newRecipients);
      notice.frozen_recipients_count = newRecipients.length;

      // Generate notifications for recipients
      const newNotifications: NoticeNotification[] = audience.users.map(u => ({
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        notice_id: notice.id,
        tenant_id: notice.tenant_id,
        user_id: u.id,
        title: notice.title,
        category_name: db.categories.find(c => c.id === notice.category_id)?.name || 'Aviso',
        priority: notice.priority,
        is_read: false,
        created_at: now,
        message: notice.priority === 'critical' ? 'Aviso Crítico obligatorio' : notice.summary.substring(0, 80) + '...',
        type: 'notice_published'
      }));
      db.notifications.push(...newNotifications);
    }
  }

  // 4. Personal Feed
  static getPersonalFeed(
    tenantId: string,
    userId: string,
    filters?: {
      search?: string;
      category_id?: string;
      priority?: string;
      read_status?: 'all' | 'unread' | 'read';
      include_expired?: boolean;
    }
  ): Notice[] {
    this.runScheduler(tenantId);
    const db = getDatabase();

    const currentUser = db.users.find(u => u.id === userId && u.tenant_id === tenantId);
    const hasAdminView = currentUser?.permissions.includes('notices.view_admin');

    // Get notices where user is in frozen recipients OR is admin
    const userRecipients = db.recipients.filter(r => r.user_id === userId && r.tenant_id === tenantId);
    const recipientNoticeMap = new Map<string, NoticeRecipient>(userRecipients.map(r => [r.notice_id, r]));

    const categoriesMap = new Map(db.categories.map(c => [c.id, c]));

    const validStatuses = filters?.include_expired ? ['published', 'expired'] : ['published'];

    let notices = db.notices.filter(n => {
      if (n.tenant_id !== tenantId) return false;
      if (!validStatuses.includes(n.status)) return false;

      // Access control: User must be recipient or have admin permission
      const isRecipient = recipientNoticeMap.has(n.id);
      if (!isRecipient && !hasAdminView) return false;

      // Category filter
      if (filters?.category_id && filters.category_id !== 'all' && n.category_id !== filters.category_id) {
        return false;
      }

      // Priority filter
      if (filters?.priority && filters.priority !== 'all' && n.priority !== filters.priority) {
        return false;
      }

      // Search filter
      if (filters?.search) {
        const s = filters.search.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(s);
        const matchesSummary = n.summary.toLowerCase().includes(s);
        if (!matchesTitle && !matchesSummary) return false;
      }

      // Read status filter
      if (filters?.read_status && filters.read_status !== 'all') {
        const rec = recipientNoticeMap.get(n.id);
        const isRead = !!rec?.read_at;
        if (filters.read_status === 'read' && !isRead) return false;
        if (filters.read_status === 'unread' && isRead) return false;
      }

      return true;
    });

    // Populate category and read status
    notices = notices.map(n => {
      const rec = recipientNoticeMap.get(n.id);
      return {
        ...n,
        category: categoriesMap.get(n.category_id),
        is_read: !!rec?.read_at,
        read_at: rec?.read_at || null
      };
    });

    // Rule: Avisos fijados primero y el resto por fecha de publicación descendente.
    notices.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.publish_at).getTime() - new Date(a.publish_at).getTime();
    });

    return notices;
  }

  // 5. Home Widget (Up to 5 active notices prioritized by pinned, critical, and recent)
  static getHomeNotices(tenantId: string, userId: string): Notice[] {
    const feed = this.getPersonalFeed(tenantId, userId, { include_expired: false });
    // Sort specifically for home: 1st Pinned, 2nd Critical, 3rd Recent
    feed.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      if (a.priority === 'critical' && b.priority !== 'critical') return -1;
      if (a.priority !== 'critical' && b.priority === 'critical') return 1;

      return new Date(b.publish_at).getTime() - new Date(a.publish_at).getTime();
    });

    return feed.slice(0, 5);
  }

  // 6. Admin Management List
  static getAdminNotices(
    tenantId: string,
    statusFilter?: 'all' | 'draft' | 'scheduled' | 'published' | 'expired' | 'archived',
    search?: string
  ): Notice[] {
    this.runScheduler(tenantId);
    const db = getDatabase();
    const categoriesMap = new Map(db.categories.map(c => [c.id, c]));

    return db.notices
      .filter(n => {
        if (n.tenant_id !== tenantId) return false;
        if (statusFilter && statusFilter !== 'all' && n.status !== statusFilter) return false;
        if (search) {
          const s = search.toLowerCase();
          if (!n.title.toLowerCase().includes(s) && !n.summary.toLowerCase().includes(s)) {
            return false;
          }
        }
        return true;
      })
      .map(n => ({
        ...n,
        category: categoriesMap.get(n.category_id)
      }))
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  // 7. Detail & Read Tracking
  static getNoticeDetail(
    tenantId: string,
    noticeId: string,
    userId: string
  ): {
    notice: Notice;
    attachments: NoticeAttachment[];
    versions: NoticeVersion[];
    comments: NoticeComment[];
  } {
    this.runScheduler(tenantId);
    const db = getDatabase();

    const notice = db.notices.find(n => n.id === noticeId && n.tenant_id === tenantId);
    if (!notice) throw new Error('Aviso no encontrado o no pertenece a la empresa');

    const currentUser = db.users.find(u => u.id === userId && u.tenant_id === tenantId);
    const isRecipient = db.recipients.some(r => r.notice_id === noticeId && r.user_id === userId);
    const hasAdmin = currentUser?.permissions.includes('notices.view_admin');

    if (!isRecipient && !hasAdmin && notice.status !== 'draft') {
      throw new Error('Acceso denegado: Este comunicado no está dirigido a tu perfil.');
    }

    // Auto mark as read if recipient
    const recipient = db.recipients.find(r => r.notice_id === noticeId && r.user_id === userId);
    if (recipient && !recipient.read_at) {
      recipient.read_at = new Date().toISOString();

      // Synchronize bell notification read status
      db.notifications.forEach(notif => {
        if (notif.notice_id === noticeId && notif.user_id === userId) {
          notif.is_read = true;
        }
      });
      saveDatabase(db);
    }

    const category = db.categories.find(c => c.id === notice.category_id);
    const attachments = db.attachments.filter(a => a.notice_id === noticeId && a.tenant_id === tenantId);
    const versions = db.versions.filter(v => v.notice_id === noticeId).sort((a, b) => b.version_number - a.version_number);

    // Comments: show all unless hidden, if hidden show to moderators or notice author
    const canModerate = currentUser?.permissions.includes('notices.moderate_comments') || notice.author_id === userId;
    const comments = db.comments
      .filter(c => c.notice_id === noticeId && c.tenant_id === tenantId)
      .filter(c => !c.is_hidden || canModerate)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return {
      notice: {
        ...notice,
        category,
        is_read: !!recipient?.read_at,
        read_at: recipient?.read_at || null
      },
      attachments,
      versions,
      comments
    };
  }

  // 8. Create or Update Draft
  static saveNotice(
    tenantId: string,
    payload: {
      id?: string;
      title: string;
      summary: string;
      content_html: string;
      category_id: string;
      priority: 'normal' | 'important' | 'critical';
      is_pinned: boolean;
      publish_at: string;
      expire_at: string | null;
      allow_comments: boolean;
      audience_criteria: NoticeAudienceCriteria;
      cover_image_url?: string;
      cover_attachment_id?: string;
      publish_immediately?: boolean;
      re_notify_recipients?: boolean;
      change_notes?: string;
    },
    currentUser: AppUser
  ): Notice {
    const db = getDatabase();
    const now = new Date();
    const sanitizedHtml = sanitizeHtml(payload.content_html);

    if (payload.id) {
      // Editing existing notice
      const existing = db.notices.find(n => n.id === payload.id && n.tenant_id === tenantId);
      if (!existing) throw new Error('Aviso no encontrado');

      // Rule: Inmutabilidad de destinatarios de aviso publicado
      if (existing.status === 'published' || existing.status === 'expired' || existing.status === 'archived') {
        // Create immutable version snapshot
        const previousAttachments = db.attachments.filter(a => a.notice_id === existing.id);
        const versionSnapshot: NoticeVersion = {
          id: `ver-${existing.id}-${existing.version}`,
          notice_id: existing.id,
          version_number: existing.version,
          title: existing.title,
          summary: existing.summary,
          content_html: existing.content_html,
          cover_attachment_id: existing.cover_attachment_id,
          change_notes: payload.change_notes || `Actualización a versión ${existing.version + 1}`,
          created_at: now.toISOString(),
          created_by_name: currentUser.name,
          attachments_count: previousAttachments.length,
          attachments_snapshot: previousAttachments.map(a => ({
            id: a.id,
            original_name: a.original_name,
            file_size: a.file_size,
            mime_type: a.mime_type
          }))
        };
        db.versions.push(versionSnapshot);

        existing.version += 1;
        existing.title = payload.title;
        existing.summary = payload.summary;
        existing.content_html = sanitizedHtml;
        existing.category_id = payload.category_id;
        existing.priority = payload.priority;
        existing.is_pinned = payload.is_pinned;
        existing.expire_at = payload.expire_at;
        existing.allow_comments = payload.allow_comments;
        existing.cover_image_url = payload.cover_image_url;
        existing.cover_attachment_id = payload.cover_attachment_id;
        existing.updated_at = now.toISOString();
        existing.updated_by = currentUser.id;

        // Rule: Re-notificar opcional a destinatarios existentes
        if (payload.re_notify_recipients) {
          const recipients = db.recipients.filter(r => r.notice_id === existing.id);
          recipients.forEach(r => {
            r.read_at = null; // reset read status to require review of new version
            db.notifications.push({
              id: `notif-upd-${Date.now()}-${r.user_id}`,
              notice_id: existing.id,
              tenant_id: tenantId,
              user_id: r.user_id,
              title: `Actualización (v${existing.version}): ${existing.title}`,
              category_name: db.categories.find(c => c.id === existing.category_id)?.name || 'Aviso',
              priority: existing.priority,
              is_read: false,
              created_at: now.toISOString(),
              message: payload.change_notes || 'El comunicado ha sido actualizado con nuevos datos y requiere tu lectura.',
              type: 'notice_updated'
            });
          });
        }

        saveDatabase(db);
        return existing;
      } else {
        // Draft or Scheduled update: can freely update audience and details
        existing.title = payload.title;
        existing.summary = payload.summary;
        existing.content_html = sanitizedHtml;
        existing.category_id = payload.category_id;
        existing.priority = payload.priority;
        existing.is_pinned = payload.is_pinned;
        existing.publish_at = payload.publish_at;
        existing.expire_at = payload.expire_at;
        existing.allow_comments = payload.allow_comments;
        existing.audience_criteria = payload.audience_criteria;
        existing.cover_image_url = payload.cover_image_url;
        existing.cover_attachment_id = payload.cover_attachment_id;
        existing.updated_at = now.toISOString();
        existing.updated_by = currentUser.id;

        if (payload.publish_immediately) {
          existing.status = 'published';
          existing.publish_at = now.toISOString();
          this._freezeRecipientsInternal(db, existing);
        } else {
          const pubDate = new Date(payload.publish_at);
          if (pubDate > now) {
            existing.status = 'scheduled';
          }
        }

        saveDatabase(db);
        return existing;
      }
    } else {
      // New Notice Creation
      const pubDate = payload.publish_immediately ? now : new Date(payload.publish_at);
      const isPublishedNow = payload.publish_immediately || pubDate <= now;

      const newNotice: Notice = {
        id: `not-${Date.now()}`,
        tenant_id: tenantId,
        title: payload.title,
        summary: payload.summary,
        content_html: sanitizedHtml,
        author_id: currentUser.id,
        author_name: currentUser.name,
        author_role: currentUser.role_label,
        category_id: payload.category_id,
        priority: payload.priority,
        is_pinned: payload.is_pinned,
        status: isPublishedNow ? 'published' : 'scheduled',
        cover_image_url: payload.cover_image_url,
        cover_attachment_id: payload.cover_attachment_id,
        publish_at: pubDate.toISOString(),
        expire_at: payload.expire_at,
        allow_comments: payload.allow_comments,
        version: 1,
        audience_criteria: payload.audience_criteria,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        created_by: currentUser.id,
        updated_by: currentUser.id
      };

      db.notices.push(newNotice);

      if (isPublishedNow) {
        this._freezeRecipientsInternal(db, newNotice);
      }

      saveDatabase(db);
      return newNotice;
    }
  }

  // 9. Save as Draft explicitly
  static saveAsDraft(
    tenantId: string,
    payload: {
      id?: string;
      title: string;
      summary: string;
      content_html: string;
      category_id: string;
      priority: 'normal' | 'important' | 'critical';
      is_pinned: boolean;
      expire_at: string | null;
      allow_comments: boolean;
      audience_criteria: NoticeAudienceCriteria;
      cover_image_url?: string;
    },
    currentUser: AppUser
  ): Notice {
    const db = getDatabase();
    const now = new Date().toISOString();
    const sanitizedHtml = sanitizeHtml(payload.content_html);

    if (payload.id) {
      const existing = db.notices.find(n => n.id === payload.id && n.tenant_id === tenantId);
      if (!existing) throw new Error('Borrador no encontrado');
      if (existing.status !== 'draft') throw new Error('Solo los borradores pueden editarse como borrador.');

      existing.title = payload.title;
      existing.summary = payload.summary;
      existing.content_html = sanitizedHtml;
      existing.category_id = payload.category_id;
      existing.priority = payload.priority;
      existing.is_pinned = payload.is_pinned;
      existing.expire_at = payload.expire_at;
      existing.allow_comments = payload.allow_comments;
      existing.audience_criteria = payload.audience_criteria;
      existing.cover_image_url = payload.cover_image_url;
      existing.updated_at = now;
      existing.updated_by = currentUser.id;

      saveDatabase(db);
      return existing;
    } else {
      const draft: Notice = {
        id: `not-${Date.now()}`,
        tenant_id: tenantId,
        title: payload.title || 'Borrador sin título',
        summary: payload.summary || '',
        content_html: sanitizedHtml,
        author_id: currentUser.id,
        author_name: currentUser.name,
        author_role: currentUser.role_label,
        category_id: payload.category_id,
        priority: payload.priority || 'normal',
        is_pinned: payload.is_pinned || false,
        status: 'draft',
        cover_image_url: payload.cover_image_url,
        publish_at: now,
        expire_at: payload.expire_at,
        allow_comments: payload.allow_comments,
        version: 1,
        audience_criteria: payload.audience_criteria,
        created_at: now,
        updated_at: now,
        created_by: currentUser.id,
        updated_by: currentUser.id
      };
      db.notices.push(draft);
      saveDatabase(db);
      return draft;
    }
  }

  // 10. Duplicate Notice (for extending audience of already published notice)
  static duplicateNotice(tenantId: string, noticeId: string, currentUser: AppUser): Notice {
    const db = getDatabase();
    const source = db.notices.find(n => n.id === noticeId && n.tenant_id === tenantId);
    if (!source) throw new Error('Aviso fuente no encontrado');

    const now = new Date().toISOString();
    const newNotice: Notice = {
      ...source,
      id: `not-${Date.now()}`,
      title: `[Copia] ${source.title}`,
      status: 'draft',
      version: 1,
      frozen_recipients_count: undefined,
      created_at: now,
      updated_at: now,
      created_by: currentUser.id,
      updated_by: currentUser.id,
      author_id: currentUser.id,
      author_name: currentUser.name,
      author_role: currentUser.role_label
    };

    db.notices.push(newNotice);

    // Duplicate attachments references
    const sourceAtts = db.attachments.filter(a => a.notice_id === source.id);
    sourceAtts.forEach(a => {
      db.attachments.push({
        ...a,
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        notice_id: newNotice.id,
        created_at: now
      });
    });

    saveDatabase(db);
    return newNotice;
  }

  // 11. Delete Draft or Archive Published
  static deleteOrArchive(tenantId: string, noticeId: string, currentUser: AppUser): { action: 'deleted' | 'archived'; message: string } {
    const db = getDatabase();
    const notice = db.notices.find(n => n.id === noticeId && n.tenant_id === tenantId);
    if (!notice) throw new Error('Aviso no encontrado');

    // Rule: Solo se eliminan definitivamente borradores. Los avisos publicados se archivan y conservan destinatarios, versiones, lecturas y comentarios.
    if (notice.status === 'draft') {
      db.notices = db.notices.filter(n => n.id !== noticeId);
      db.attachments = db.attachments.filter(a => a.notice_id !== noticeId);
      saveDatabase(db);
      return { action: 'deleted', message: 'Borrador eliminado permanentemente de la base de datos.' };
    } else {
      notice.status = 'archived';
      notice.updated_at = new Date().toISOString();
      notice.updated_by = currentUser.id;
      saveDatabase(db);
      return { action: 'archived', message: 'Aviso archivado. Sus lecturas, comentarios e historial de versiones se mantienen preservados.' };
    }
  }

  // 12. Metrics & Audience Read Tracking
  static getMetrics(tenantId: string, noticeId: string): NoticeMetrics {
    const db = getDatabase();
    const notice = db.notices.find(n => n.id === noticeId && n.tenant_id === tenantId);
    if (!notice) throw new Error('Aviso no encontrado');

    const recipients = db.recipients.filter(r => r.notice_id === noticeId && r.tenant_id === tenantId);
    const total_delivered = recipients.length;
    const total_read = recipients.filter(r => !!r.read_at).length;
    const total_unread = total_delivered - total_read;
    const read_percentage = total_delivered > 0 ? Math.round((total_read / total_delivered) * 100) : 0;

    return {
      notice_id: noticeId,
      total_delivered,
      total_read,
      total_unread,
      read_percentage,
      recipients: recipients.sort((a, b) => {
        if (a.read_at && !b.read_at) return -1;
        if (!a.read_at && b.read_at) return 1;
        return a.user_name.localeCompare(b.user_name);
      })
    };
  }

  // 13. File Attachment Upload Simulation with Full Validation
  static addAttachment(
    tenantId: string,
    noticeId: string,
    fileMeta: { name: string; size: number; mimeType?: string; isCover?: boolean; dataUrl?: string }
  ): NoticeAttachment {
    const db = getDatabase();
    const existing = db.attachments.filter(a => a.notice_id === noticeId);

    if (existing.length >= MAX_ATTACHMENTS_PER_NOTICE) {
      throw new Error(`Límite excedido: Un aviso puede tener un máximo de ${MAX_ATTACHMENTS_PER_NOTICE} archivos adjuntos en total.`);
    }

    const val = validateAttachmentFile(fileMeta.name, fileMeta.size);
    if (!val.valid) {
      throw new Error(val.error);
    }

    const now = new Date().toISOString();
    const internalId = `sec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${val.extension}`;

    // If marked as cover, unmark any previous cover
    if (fileMeta.isCover) {
      existing.forEach(a => (a.is_cover = false));
    }

    const newAttachment: NoticeAttachment = {
      id: `att-${Date.now()}`,
      notice_id: noticeId,
      tenant_id: tenantId,
      original_name: fileMeta.name,
      internal_id: internalId,
      file_size: fileMeta.size,
      mime_type: fileMeta.mimeType || `application/${val.extension}`,
      is_cover: !!fileMeta.isCover,
      download_token: `tok_sec_${Math.random().toString(36).substring(2, 12)}`,
      created_at: now,
      data_url: fileMeta.dataUrl
    };

    db.attachments.push(newAttachment);
    saveDatabase(db);
    return newAttachment;
  }

  static deleteAttachment(tenantId: string, attachmentId: string): void {
    const db = getDatabase();
    // Rule: Mantener referencias a archivos usados por versiones anteriores para impedir que la limpieza de archivos los elimine.
    const isUsedInVersion = db.versions.some(v => v.attachments_snapshot.some(s => s.id === attachmentId));
    if (isUsedInVersion) {
      throw new Error('No es posible eliminar físicamente este archivo porque forma parte del historial inmutable de una versión previa.');
    }
    db.attachments = db.attachments.filter(a => !(a.id === attachmentId && a.tenant_id === tenantId));
    saveDatabase(db);
  }

  // 14. Comments Management
  static addComment(tenantId: string, noticeId: string, content: string, currentUser: AppUser): NoticeComment {
    const db = getDatabase();
    const notice = db.notices.find(n => n.id === noticeId && n.tenant_id === tenantId);
    if (!notice) throw new Error('Aviso no encontrado');

    if (!notice.allow_comments) {
      throw new Error('Los comentarios están desactivados para este aviso.');
    }

    // Rule: Los avisos expirados o archivados conservan comentarios en modo lectura, pero no aceptan nuevos.
    if (notice.status === 'expired' || notice.status === 'archived') {
      throw new Error('Este aviso ha expirado o sido archivado y no acepta nuevos comentarios.');
    }

    // Check user is authenticated internal recipient or author or admin
    const isRecipient = db.recipients.some(r => r.notice_id === noticeId && r.user_id === currentUser.id);
    const hasAdmin = currentUser.permissions.includes('notices.view_admin');
    if (!isRecipient && !hasAdmin && notice.author_id !== currentUser.id) {
      throw new Error('Solo los destinatarios asignados a este comunicado pueden comentar.');
    }

    const now = new Date().toISOString();
    const newComment: NoticeComment = {
      id: `comm-${Date.now()}`,
      notice_id: noticeId,
      tenant_id: tenantId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_avatar: currentUser.avatar,
      user_role: currentUser.role_label,
      content: content.trim(),
      is_hidden: false,
      created_at: now
    };

    db.comments.push(newComment);

    // Rule: El autor del aviso y quienes ya participaron recibirán notificación de comentarios nuevos, excluyendo al autor del comentario.
    const notifiedUserIds = new Set<string>();
    if (notice.author_id !== currentUser.id) {
      notifiedUserIds.add(notice.author_id);
    }

    // Previous commenters
    const previousCommenters = db.comments.filter(c => c.notice_id === noticeId && c.user_id !== currentUser.id);
    previousCommenters.forEach(c => notifiedUserIds.add(c.user_id));

    notifiedUserIds.forEach(targetUserId => {
      db.notifications.push({
        id: `notif-comm-${Date.now()}-${targetUserId}`,
        notice_id: noticeId,
        tenant_id: tenantId,
        user_id: targetUserId,
        title: `Nuevo comentario en: ${notice.title}`,
        category_name: db.categories.find(c => c.id === notice.category_id)?.name || 'Aviso',
        priority: 'normal',
        is_read: false,
        created_at: now,
        message: `${currentUser.name} ha comentado: "${content.substring(0, 60)}..."`,
        type: 'comment_added'
      });
    });

    saveDatabase(db);
    return newComment;
  }

  static moderateComment(
    tenantId: string,
    commentId: string,
    moderator: AppUser,
    reason: string
  ): NoticeComment {
    const db = getDatabase();
    const comment = db.comments.find(c => c.id === commentId && c.tenant_id === tenantId);
    if (!comment) throw new Error('Comentario no encontrado');

    if (!moderator.permissions.includes('notices.moderate_comments')) {
      throw new Error('No tienes permisos de moderación de comentarios.');
    }

    comment.is_hidden = true;
    comment.hidden_at = new Date().toISOString();
    comment.hidden_by = `${moderator.name} (${moderator.role_label})`;
    comment.hidden_reason = reason;

    saveDatabase(db);
    return comment;
  }

  // 15. Notifications
  static getUserNotifications(tenantId: string, userId: string): NoticeNotification[] {
    const db = getDatabase();
    return db.notifications
      .filter(n => n.tenant_id === tenantId && n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static markNotificationAsRead(notificationId: string): void {
    const db = getDatabase();
    const notif = db.notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.is_read = true;
      saveDatabase(db);
    }
  }

  static markAllNotificationsAsRead(tenantId: string, userId: string): void {
    const db = getDatabase();
    db.notifications.forEach(n => {
      if (n.tenant_id === tenantId && n.user_id === userId) {
        n.is_read = true;
      }
    });
    saveDatabase(db);
  }
}
