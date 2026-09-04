export type NoticeStatus = 'draft' | 'scheduled' | 'published' | 'expired' | 'archived';

export type NoticePriority = 'normal' | 'important' | 'critical';

export type AudienceType = 'all' | 'segmented';

export interface NoticeCategory {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string;
  color: string; // Tailwind color token or hex
  icon?: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoticeAttachment {
  id: string;
  notice_id: string;
  tenant_id: string;
  original_name: string;
  internal_id: string;
  file_size: number; // in bytes
  mime_type: string;
  is_cover: boolean;
  download_token?: string;
  created_at: string;
  data_url?: string; // for mock preview/download
}

export interface NoticeVersion {
  id: string;
  notice_id: string;
  version_number: number;
  title: string;
  summary: string;
  content_html: string;
  cover_attachment_id?: string;
  change_notes?: string;
  created_at: string;
  created_by_name: string;
  attachments_count: number;
  attachments_snapshot: {
    id: string;
    original_name: string;
    file_size: number;
    mime_type: string;
  }[];
}

export interface NoticeRecipient {
  id: string;
  notice_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  user_branch?: string;
  tenant_id: string;
  delivered_at: string;
  read_at: string | null;
}

export interface NoticeComment {
  id: string;
  notice_id: string;
  tenant_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  user_role: string;
  content: string;
  is_hidden: boolean;
  hidden_at?: string;
  hidden_by?: string;
  hidden_reason?: string;
  created_at: string;
}

export interface NoticeAudienceCriteria {
  type: AudienceType; // 'all' | 'segmented'
  roles: string[]; // selected role IDs
  branches: string[]; // selected branch IDs
  specific_user_ids: string[]; // specifically targeted user IDs
}

export interface Notice {
  id: string;
  tenant_id: string;
  title: string;
  summary: string;
  content_html: string;
  author_id: string;
  author_name: string;
  author_role: string;
  category_id: string;
  category?: NoticeCategory;
  priority: NoticePriority;
  is_pinned: boolean;
  status: NoticeStatus;
  cover_image_url?: string;
  cover_attachment_id?: string;
  publish_at: string;
  expire_at: string | null;
  allow_comments: boolean;
  version: number;
  audience_criteria: NoticeAudienceCriteria;
  frozen_recipients_count?: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  // Dynamic computed fields per current user
  is_read?: boolean;
  read_at?: string | null;
}

export interface NoticeMetrics {
  notice_id: string;
  total_delivered: number;
  total_read: number;
  total_unread: number;
  read_percentage: number;
  recipients: NoticeRecipient[];
}

export interface AppUser {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: string; // e.g. 'admin', 'hr_comms', 'branch_manager', 'operations', 'logistics'
  role_label: string;
  branch_id?: string;
  branch_name?: string;
  is_internal: boolean; // false for clients
  is_active: boolean;
  avatar?: string;
  permissions: string[];
}

export interface AppTenant {
  id: string;
  name: string;
  legal_name: string;
  timezone: string;
  logo?: string;
}

export type Tenant = AppTenant;

export interface AppBranch {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
}

export interface AppRole {
  id: string;
  name: string;
  label: string;
  description: string;
}

export interface NoticeNotification {
  id: string;
  notice_id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  category_name: string;
  priority: NoticePriority;
  is_read: boolean;
  created_at: string;
  message: string;
  type: 'notice_published' | 'notice_updated' | 'comment_added';
}
