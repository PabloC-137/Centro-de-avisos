import {
  Notice,
  NoticeCategory,
  NoticeAttachment,
  NoticeVersion,
  NoticeRecipient,
  NoticeComment,
  NoticeNotification,
  AppTenant,
  AppUser,
  AppBranch,
  AppRole,
  NoticeAudienceCriteria
} from '../types';

// Storage keys
const STORAGE_KEY = 'portal_notices_db_v1';

export interface DatabaseSchema {
  tenants: AppTenant[];
  branches: AppBranch[];
  roles: AppRole[];
  users: AppUser[];
  categories: NoticeCategory[];
  notices: Notice[];
  versions: NoticeVersion[];
  recipients: NoticeRecipient[];
  attachments: NoticeAttachment[];
  comments: NoticeComment[];
  notifications: NoticeNotification[];
  audit_logs: {
    id: string;
    tenant_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    user_id: string;
    timestamp: string;
    details?: string;
  }[];
}

// Initial Seed Data
const INITIAL_TENANTS: AppTenant[] = [
  {
    id: 'tenant-alsea',
    name: 'Alsea Retail & Servicios México',
    legal_name: 'Operadora de Alimentos y Retail S.A. de C.V.',
    timezone: 'America/Mexico_City',
  },
  {
    id: 'tenant-nexus',
    name: 'Nexus Industrial Group',
    legal_name: 'Nexus Manufactura y Logística S.A.P.I.',
    timezone: 'America/Monterrey',
  }
];

const INITIAL_BRANCHES: AppBranch[] = [
  { id: 'branch-polanco', tenant_id: 'tenant-alsea', name: 'Sucursal Polanco CDMX', code: 'POL-01' },
  { id: 'branch-santafe', tenant_id: 'tenant-alsea', name: 'Sucursal Santa Fe CDMX', code: 'STF-02' },
  { id: 'branch-reforma', tenant_id: 'tenant-alsea', name: 'Corporativo Torre Reforma', code: 'REF-HQ' },
  { id: 'branch-cedis', tenant_id: 'tenant-alsea', name: 'Centro de Distribución Tlalnepantla', code: 'CED-01' },
  { id: 'branch-mty', tenant_id: 'tenant-nexus', name: 'Planta Monterrey Apodaca', code: 'MTY-P1' },
  { id: 'branch-saltillo', tenant_id: 'tenant-nexus', name: 'Parque Industrial Saltillo', code: 'SLT-P2' },
];

const INITIAL_ROLES: AppRole[] = [
  { id: 'admin', name: 'admin', label: 'Director / Administrador General', description: 'Acceso total a configuración y gobernanza' },
  { id: 'hr_comms', name: 'hr_comms', label: 'Comunicación Interna y RRHH', description: 'Redacción, programación y métricas' },
  { id: 'branch_manager', name: 'branch_manager', label: 'Gerente de Sucursal / Planta', description: 'Gestión de equipos locales y moderación' },
  { id: 'operations', name: 'operations', label: 'Operativo / Ventas de Piso', description: 'Personal operativo de primera línea' },
  { id: 'logistics', name: 'logistics', label: 'Almacén y Distribución', description: 'Personal de patio y logística' },
];

const INITIAL_USERS: AppUser[] = [
  // Tenant Alsea Users
  {
    id: 'user-carlos',
    tenant_id: 'tenant-alsea',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@alsea.corp',
    role: 'admin',
    role_label: 'Administrador General',
    branch_id: 'branch-reforma',
    branch_name: 'Corporativo Torre Reforma',
    is_internal: true,
    is_active: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    permissions: [
      'notices.manage_categories',
      'notices.view_admin',
      'notices.create_draft',
      'notices.publish_schedule',
      'notices.archive',
      'notices.moderate_comments'
    ]
  },
  {
    id: 'user-valeria',
    tenant_id: 'tenant-alsea',
    name: 'Valeria Solís',
    email: 'valeria.solis@alsea.corp',
    role: 'hr_comms',
    role_label: 'Líder Comunicación Interna',
    branch_id: 'branch-reforma',
    branch_name: 'Corporativo Torre Reforma',
    is_internal: true,
    is_active: true,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    permissions: [
      'notices.manage_categories',
      'notices.view_admin',
      'notices.create_draft',
      'notices.publish_schedule',
      'notices.archive',
      'notices.moderate_comments'
    ]
  },
  {
    id: 'user-roberto',
    tenant_id: 'tenant-alsea',
    name: 'Roberto Gómez',
    email: 'roberto.gomez@alsea.corp',
    role: 'branch_manager',
    role_label: 'Gerente Sucursal Polanco',
    branch_id: 'branch-polanco',
    branch_name: 'Sucursal Polanco CDMX',
    is_internal: true,
    is_active: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    permissions: [
      'notices.view_admin',
      'notices.moderate_comments'
    ]
  },
  {
    id: 'user-ana',
    tenant_id: 'tenant-alsea',
    name: 'Ana Laura Cruz',
    email: 'ana.cruz@alsea.corp',
    role: 'operations',
    role_label: 'Líder de Cajas Polanco',
    branch_id: 'branch-polanco',
    branch_name: 'Sucursal Polanco CDMX',
    is_internal: true,
    is_active: true,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    permissions: [] // regular reader
  },
  {
    id: 'user-diego',
    tenant_id: 'tenant-alsea',
    name: 'Diego Morales',
    email: 'diego.morales@alsea.corp',
    role: 'operations',
    role_label: 'Asesor Comercial Santa Fe',
    branch_id: 'branch-santafe',
    branch_name: 'Sucursal Santa Fe CDMX',
    is_internal: true,
    is_active: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    permissions: [] // regular reader
  },
  {
    id: 'user-miguel',
    tenant_id: 'tenant-alsea',
    name: 'Miguel Ángel Peña',
    email: 'miguel.pena@alsea.corp',
    role: 'logistics',
    role_label: 'Supervisor de Embarques CEDIS',
    branch_id: 'branch-cedis',
    branch_name: 'Centro de Distribución Tlalnepantla',
    is_internal: true,
    is_active: true,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    permissions: []
  },
  {
    id: 'user-inactivo',
    tenant_id: 'tenant-alsea',
    name: 'Fernando Castro (Baja Temporal)',
    email: 'fernando.castro@alsea.corp',
    role: 'operations',
    role_label: 'Operativo en Licencia',
    branch_id: 'branch-polanco',
    branch_name: 'Sucursal Polanco CDMX',
    is_internal: true,
    is_active: false, // Inactive employee (must be excluded from audience)
    permissions: []
  },
  {
    id: 'user-cliente-ecommerce',
    tenant_id: 'tenant-alsea',
    name: 'Comprador Online #883',
    email: 'cliente@gmail.com',
    role: 'customer',
    role_label: 'Cliente Ecommerce',
    is_internal: false, // External client (must be strictly excluded)
    is_active: true,
    permissions: []
  },
  // Tenant Nexus Users (for testing multi-tenant isolation)
  {
    id: 'user-nexus-admin',
    tenant_id: 'tenant-nexus',
    name: 'Ing. Rodrigo Garza',
    email: 'rodrigo.garza@nexus-ind.com',
    role: 'admin',
    role_label: 'Gerente General Nexus',
    branch_id: 'branch-mty',
    branch_name: 'Planta Monterrey Apodaca',
    is_internal: true,
    is_active: true,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    permissions: [
      'notices.manage_categories',
      'notices.view_admin',
      'notices.create_draft',
      'notices.publish_schedule',
      'notices.archive',
      'notices.moderate_comments'
    ]
  },
  {
    id: 'user-nexus-worker',
    tenant_id: 'tenant-nexus',
    name: 'Patricia Domínguez',
    email: 'patricia.d@nexus-ind.com',
    role: 'operations',
    role_label: 'Técnica de Ensamble Saltillo',
    branch_id: 'branch-saltillo',
    branch_name: 'Parque Industrial Saltillo',
    is_internal: true,
    is_active: true,
    permissions: []
  }
];

// Initial Categories per tenant (as requested: General, Productos, Promociones, Operación, Corporativo)
const createInitialCategories = (tenantId: string): NoticeCategory[] => [
  {
    id: `cat-general-${tenantId}`,
    tenant_id: tenantId,
    name: 'General',
    slug: 'general',
    description: 'Comunicados y avisos institucionales de interés general',
    color: 'slate',
    icon: 'info',
    order: 1,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: `cat-productos-${tenantId}`,
    tenant_id: tenantId,
    name: 'Productos',
    slug: 'productos',
    description: 'Lanzamientos, cambios de carta, stock y novedades de producto',
    color: 'blue',
    icon: 'shopping-bag',
    order: 2,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: `cat-promociones-${tenantId}`,
    tenant_id: tenantId,
    name: 'Promociones',
    slug: 'promociones',
    description: 'Campañas comerciales, cupones y dinámicas de temporada',
    color: 'emerald',
    icon: 'tag',
    order: 3,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: `cat-operacion-${tenantId}`,
    tenant_id: tenantId,
    name: 'Operación',
    slug: 'operacion',
    description: 'Procesos de apertura/cierre, cajas, estándares e inventarios',
    color: 'amber',
    icon: 'wrench',
    order: 4,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: `cat-corporativo-${tenantId}`,
    tenant_id: tenantId,
    name: 'Corporativo',
    slug: 'corporativo',
    description: 'Beneficios, directivas de RRHH, seguros y cultura laboral',
    color: 'purple',
    icon: 'building',
    order: 5,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  }
];

export function getDatabase(): DatabaseSchema {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.notices) && Array.isArray(parsed.categories)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not parse localStorage DB, reseeding...', e);
  }
  return seedDatabase();
}

export function saveDatabase(db: DatabaseSchema): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function seedDatabase(): DatabaseSchema {
  const alseaCats = createInitialCategories('tenant-alsea');
  const nexusCats = createInitialCategories('tenant-nexus');
  const allCats = [...alseaCats, ...nexusCats];

  const now = new Date();
  const pastHour = new Date(now.getTime() - 2 * 3600000).toISOString();
  const yesterday = new Date(now.getTime() - 86400000).toISOString();
  const futureDay = new Date(now.getTime() + 15 * 86400000).toISOString();
  const expiredPast = new Date(now.getTime() - 30 * 86400000).toISOString();

  // Seed Notice 1: Critical Pinned Operation notice for operations in Polanco & Santa Fe
  const notice1Id = 'not-alsea-01';
  const notice1: Notice = {
    id: notice1Id,
    tenant_id: 'tenant-alsea',
    title: 'Protocolo de Seguridad y Control de Cajas Q3',
    summary: 'Instrucciones obligatorias para cortes de terminal, resguardo en bóveda y validación de billetes para sucursales Polanco y Santa Fe.',
    content_html: `<h2>Protocolo de Cierre Seguro de Sucursal</h2>
<p>Estimado equipo operativo de <strong>Polanco</strong> y <strong>Santa Fe</strong>:</p>
<p>A partir del presente ciclo, todo corte Z debe efectuarse con doble firma y resguardo inmediato en la tómbola de seguridad.</p>
<ul>
  <li>Validación obligatoria con lápiz detector en billetes mayores a $200 MXN.</li>
  <li>Límite de efectivo por gaveta: $4,000 MXN antes de arqueo ciego.</li>
  <li>Reporte diario enviado a Tesorería antes de las 22:30 hrs.</li>
</ul>
<p>Cualquier incidencia operativa debe notificarse directamente a su Gerente de Sucursal.</p>`,
    author_id: 'user-valeria',
    author_name: 'Valeria Solís',
    author_role: 'Líder Comunicación Interna',
    category_id: alseaCats.find(c => c.slug === 'operacion')!.id,
    priority: 'critical',
    is_pinned: true,
    status: 'published',
    cover_image_url: 'https://images.unsplash.com/photo-1556742049-0a67e5572293?w=800&auto=format&fit=crop&q=80',
    publish_at: yesterday,
    expire_at: futureDay,
    allow_comments: true,
    version: 2,
    audience_criteria: {
      type: 'segmented',
      roles: ['operations', 'branch_manager'],
      branches: ['branch-polanco', 'branch-santafe'],
      specific_user_ids: []
    },
    frozen_recipients_count: 3, // roberto (mgr polanco), ana (op polanco), diego (op santafe)
    created_at: yesterday,
    updated_at: pastHour,
    created_by: 'user-valeria',
    updated_by: 'user-valeria'
  };

  // Seed Notice 2: Company-wide Corporate Notice
  const notice2Id = 'not-alsea-02';
  const notice2: Notice = {
    id: notice2Id,
    tenant_id: 'tenant-alsea',
    title: 'Renovación de Póliza de Gastos Médicos Mayores 2026',
    summary: 'Periodo de alta de dependientes económicos y desglose de nuevos beneficios de cobertura médica y dental.',
    content_html: `<h2>Actualización de Beneficios Corporativos</h2>
<p>Nos complace anunciar la ampliación del plan médico integral para todos los colaboradores de Alsea México.</p>
<p>Principales mejoras integradas:</p>
<ol>
  <li>Deducible reducido en red hospitalaria preferente nivel A y B.</li>
  <li>Cobertura dental preventiva 100% cubierta (2 limpiezas anuales).</li>
  <li>Asistencia psicológica y nutricional vía telemedicina sin costo.</li>
</ol>
<p>Favor de revisar la guía adjunta y enviar constancias antes del 25 de este mes.</p>`,
    author_id: 'user-valeria',
    author_name: 'Valeria Solís',
    author_role: 'Líder Comunicación Interna',
    category_id: alseaCats.find(c => c.slug === 'corporativo')!.id,
    priority: 'important',
    is_pinned: false,
    status: 'published',
    cover_image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80',
    publish_at: yesterday,
    expire_at: futureDay,
    allow_comments: true,
    version: 1,
    audience_criteria: {
      type: 'all',
      roles: [],
      branches: [],
      specific_user_ids: []
    },
    frozen_recipients_count: 6,
    created_at: yesterday,
    updated_at: yesterday,
    created_by: 'user-valeria',
    updated_by: 'user-valeria'
  };

  // Seed Notice 3: Products Launch Notice
  const notice3Id = 'not-alsea-03';
  const notice3: Notice = {
    id: notice3Id,
    tenant_id: 'tenant-alsea',
    title: 'Catálogo de Temporada: Menú Artesanal & Bebidas Frías',
    summary: 'Capacitación en preparación, alérgenos y precios de venta al público para las nuevas bebidas de verano.',
    content_html: `<h2>Lanzamiento Oficial: Temporada Fría</h2>
<p>A partir del próximo lunes entra en vigor el nuevo recetario en piso de venta.</p>
<p>Recordar los lineamientos clave de sanitización de licuadoras y control de temperatura en vitrinas.</p>`,
    author_id: 'user-valeria',
    author_name: 'Valeria Solís',
    author_role: 'Líder Comunicación Interna',
    category_id: alseaCats.find(c => c.slug === 'productos')!.id,
    priority: 'normal',
    is_pinned: false,
    status: 'published',
    publish_at: pastHour,
    expire_at: futureDay,
    allow_comments: false,
    version: 1,
    audience_criteria: {
      type: 'all',
      roles: [],
      branches: [],
      specific_user_ids: []
    },
    frozen_recipients_count: 6,
    created_at: pastHour,
    updated_at: pastHour,
    created_by: 'user-valeria',
    updated_by: 'user-valeria'
  };

  // Seed Notice 4: Draft notice
  const notice4Id = 'not-alsea-04';
  const notice4: Notice = {
    id: notice4Id,
    tenant_id: 'tenant-alsea',
    title: 'Borrador: Campaña de Incentivos por Ventas Cruzadas Q4',
    summary: 'Bases de competencia interna y bonos de productividad para gerentes y asesores de mostrador.',
    content_html: `<p>Borrador en revisión por Dirección Financiera.</p>`,
    author_id: 'user-carlos',
    author_name: 'Carlos Mendoza',
    author_role: 'Administrador General',
    category_id: alseaCats.find(c => c.slug === 'promociones')!.id,
    priority: 'normal',
    is_pinned: false,
    status: 'draft',
    publish_at: now.toISOString(),
    expire_at: null,
    allow_comments: false,
    version: 1,
    audience_criteria: {
      type: 'all',
      roles: [],
      branches: [],
      specific_user_ids: []
    },
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    created_by: 'user-carlos',
    updated_by: 'user-carlos'
  };

  // Seed Notice 5: Expired notice (CyberWeek pasada)
  const notice5Id = 'not-alsea-05';
  const notice5: Notice = {
    id: notice5Id,
    tenant_id: 'tenant-alsea',
    title: 'Procedimiento de Logística para CyberWeek (Concluido)',
    summary: 'Horarios extraordinarios de entrega y guardias para personal de almacén.',
    content_html: `<p>Aviso cerrado. El periodo de promociones extraordinarias ha finalizado exitosamente.</p>`,
    author_id: 'user-valeria',
    author_name: 'Valeria Solís',
    author_role: 'Líder Comunicación Interna',
    category_id: alseaCats.find(c => c.slug === 'operacion')!.id,
    priority: 'normal',
    is_pinned: false,
    status: 'expired',
    publish_at: expiredPast,
    expire_at: yesterday,
    allow_comments: true,
    version: 1,
    audience_criteria: {
      type: 'all',
      roles: [],
      branches: [],
      specific_user_ids: []
    },
    frozen_recipients_count: 6,
    created_at: expiredPast,
    updated_at: expiredPast,
    created_by: 'user-valeria',
    updated_by: 'user-valeria'
  };

  // Seed Attachments
  const attachments: NoticeAttachment[] = [
    {
      id: 'att-1',
      notice_id: notice1Id,
      tenant_id: 'tenant-alsea',
      original_name: 'Manual_Protocolo_Cajas_2026.pdf',
      internal_id: 'sec_file_9831_cajas.pdf',
      file_size: 2450000,
      mime_type: 'application/pdf',
      is_cover: false,
      download_token: 'tok_att_1_sec',
      created_at: yesterday
    },
    {
      id: 'att-2',
      notice_id: notice1Id,
      tenant_id: 'tenant-alsea',
      original_name: 'Formato_Arqueo_Boveda.xlsx',
      internal_id: 'sec_file_1102_arqueo.xlsx',
      file_size: 512000,
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      is_cover: false,
      download_token: 'tok_att_2_sec',
      created_at: yesterday
    },
    {
      id: 'att-3',
      notice_id: notice2Id,
      tenant_id: 'tenant-alsea',
      original_name: 'Poliza_Seguro_Gastos_Medicos_2026.pdf',
      internal_id: 'sec_file_8872_poliza.pdf',
      file_size: 3800000,
      mime_type: 'application/pdf',
      is_cover: false,
      download_token: 'tok_att_3_sec',
      created_at: yesterday
    }
  ];

  // Seed Versions for notice1 (demonstrating version 1 and 2)
  const versions: NoticeVersion[] = [
    {
      id: 'ver-1',
      notice_id: notice1Id,
      version_number: 1,
      title: 'Protocolo de Seguridad y Control de Cajas (Versión Preliminar)',
      summary: 'Instrucciones iniciales de arqueo de gavetas para Polanco y Santa Fe.',
      content_html: `<p>Versión inicial sin especificación de resguardo en tómbola.</p>`,
      change_notes: 'Publicación original del comunicado',
      created_at: yesterday,
      created_by_name: 'Valeria Solís',
      attachments_count: 1,
      attachments_snapshot: [
        {
          id: 'att-1',
          original_name: 'Manual_Protocolo_Cajas_2026.pdf',
          file_size: 2450000,
          mime_type: 'application/pdf'
        }
      ]
    }
  ];

  // Seed Recipients (frozen for notice1: roberto, ana, diego)
  const recipients: NoticeRecipient[] = [
    // Notice 1 recipients
    {
      id: 'rec-1-roberto',
      notice_id: notice1Id,
      user_id: 'user-roberto',
      user_name: 'Roberto Gómez',
      user_email: 'roberto.gomez@alsea.corp',
      user_role: 'Gerente Sucursal Polanco',
      user_branch: 'Sucursal Polanco CDMX',
      tenant_id: 'tenant-alsea',
      delivered_at: yesterday,
      read_at: pastHour // read
    },
    {
      id: 'rec-1-ana',
      notice_id: notice1Id,
      user_id: 'user-ana',
      user_name: 'Ana Laura Cruz',
      user_email: 'ana.cruz@alsea.corp',
      user_role: 'Líder de Cajas Polanco',
      user_branch: 'Sucursal Polanco CDMX',
      tenant_id: 'tenant-alsea',
      delivered_at: yesterday,
      read_at: null // unread
    },
    {
      id: 'rec-1-diego',
      notice_id: notice1Id,
      user_id: 'user-diego',
      user_name: 'Diego Morales',
      user_email: 'diego.morales@alsea.corp',
      user_role: 'Asesor Comercial Santa Fe',
      user_branch: 'Sucursal Santa Fe CDMX',
      tenant_id: 'tenant-alsea',
      delivered_at: yesterday,
      read_at: null // unread
    },

    // Notice 2 recipients (all active internal employees)
    {
      id: 'rec-2-carlos',
      notice_id: notice2Id,
      user_id: 'user-carlos',
      user_name: 'Carlos Mendoza',
      user_email: 'carlos.mendoza@alsea.corp',
      user_role: 'Administrador General',
      user_branch: 'Corporativo Torre Reforma',
      tenant_id: 'tenant-alsea',
      delivered_at: yesterday,
      read_at: yesterday
    },
    {
      id: 'rec-2-valeria',
      notice_id: notice2Id,
      user_id: 'user-valeria',
      user_name: 'Valeria Solís',
      user_email: 'valeria.solis@alsea.corp',
      user_role: 'Líder Comunicación Interna',
      user_branch: 'Corporativo Torre Reforma',
      tenant_id: 'tenant-alsea',
      delivered_at: yesterday,
      read_at: yesterday
    },
    {
      id: 'rec-2-roberto',
      notice_id: notice2Id,
      user_id: 'user-roberto',
      user_name: 'Roberto Gómez',
      user_email: 'roberto.gomez@alsea.corp',
      user_role: 'Gerente Sucursal Polanco',
      user_branch: 'Sucursal Polanco CDMX',
      tenant_id: 'tenant-alsea',
      delivered_at: yesterday,
      read_at: yesterday
    },
    {
      id: 'rec-2-ana',
      notice_id: notice2Id,
      user_id: 'user-ana',
      user_name: 'Ana Laura Cruz',
      user_email: 'ana.cruz@alsea.corp',
      user_role: 'Líder de Cajas Polanco',
      user_branch: 'Sucursal Polanco CDMX',
      tenant_id: 'tenant-alsea',
      delivered_at: yesterday,
      read_at: null
    },
    {
      id: 'rec-2-diego',
      notice_id: notice2Id,
      user_id: 'user-diego',
      user_name: 'Diego Morales',
      user_email: 'diego.morales@alsea.corp',
      user_role: 'Asesor Comercial Santa Fe',
      user_branch: 'Sucursal Santa Fe CDMX',
      tenant_id: 'tenant-alsea',
      delivered_at: yesterday,
      read_at: null
    },
    {
      id: 'rec-2-miguel',
      notice_id: notice2Id,
      user_id: 'user-miguel',
      user_name: 'Miguel Ángel Peña',
      user_email: 'miguel.pena@alsea.corp',
      user_role: 'Supervisor de Embarques CEDIS',
      user_branch: 'Centro de Distribución Tlalnepantla',
      tenant_id: 'tenant-alsea',
      delivered_at: yesterday,
      read_at: null
    },

    // Notice 3 recipients (all)
    {
      id: 'rec-3-carlos',
      notice_id: notice3Id,
      user_id: 'user-carlos',
      user_name: 'Carlos Mendoza',
      user_email: 'carlos.mendoza@alsea.corp',
      user_role: 'Administrador General',
      tenant_id: 'tenant-alsea',
      delivered_at: pastHour,
      read_at: null
    },
    {
      id: 'rec-3-valeria',
      notice_id: notice3Id,
      user_id: 'user-valeria',
      user_name: 'Valeria Solís',
      user_email: 'valeria.solis@alsea.corp',
      user_role: 'Líder Comunicación Interna',
      tenant_id: 'tenant-alsea',
      delivered_at: pastHour,
      read_at: pastHour
    },
    {
      id: 'rec-3-roberto',
      notice_id: notice3Id,
      user_id: 'user-roberto',
      user_name: 'Roberto Gómez',
      user_email: 'roberto.gomez@alsea.corp',
      user_role: 'Gerente Sucursal Polanco',
      tenant_id: 'tenant-alsea',
      delivered_at: pastHour,
      read_at: null
    },
    {
      id: 'rec-3-ana',
      notice_id: notice3Id,
      user_id: 'user-ana',
      user_name: 'Ana Laura Cruz',
      user_email: 'ana.cruz@alsea.corp',
      user_role: 'Líder de Cajas Polanco',
      tenant_id: 'tenant-alsea',
      delivered_at: pastHour,
      read_at: null
    },
    {
      id: 'rec-3-diego',
      notice_id: notice3Id,
      user_id: 'user-diego',
      user_name: 'Diego Morales',
      user_email: 'diego.morales@alsea.corp',
      user_role: 'Asesor Comercial Santa Fe',
      tenant_id: 'tenant-alsea',
      delivered_at: pastHour,
      read_at: null
    },
    {
      id: 'rec-3-miguel',
      notice_id: notice3Id,
      user_id: 'user-miguel',
      user_name: 'Miguel Ángel Peña',
      user_email: 'miguel.pena@alsea.corp',
      user_role: 'Supervisor de Embarques CEDIS',
      tenant_id: 'tenant-alsea',
      delivered_at: pastHour,
      read_at: null
    },

    // Notice 5 (expired) recipients
    {
      id: 'rec-5-carlos',
      notice_id: notice5Id,
      user_id: 'user-carlos',
      user_name: 'Carlos Mendoza',
      user_email: 'carlos.mendoza@alsea.corp',
      user_role: 'Administrador General',
      tenant_id: 'tenant-alsea',
      delivered_at: expiredPast,
      read_at: expiredPast
    },
    {
      id: 'rec-5-roberto',
      notice_id: notice5Id,
      user_id: 'user-roberto',
      user_name: 'Roberto Gómez',
      user_email: 'roberto.gomez@alsea.corp',
      user_role: 'Gerente Sucursal Polanco',
      tenant_id: 'tenant-alsea',
      delivered_at: expiredPast,
      read_at: expiredPast
    }
  ];

  // Seed Comments for notice 1
  const comments: NoticeComment[] = [
    {
      id: 'comm-1',
      notice_id: notice1Id,
      tenant_id: 'tenant-alsea',
      user_id: 'user-roberto',
      user_name: 'Roberto Gómez',
      user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      user_role: 'Gerente Sucursal Polanco',
      content: 'Enterado en Sucursal Polanco. Ya instruí a los supervisores de turno matutino y vespertino para revisar el arqueo de gavetas.',
      is_hidden: false,
      created_at: pastHour
    },
    {
      id: 'comm-2',
      notice_id: notice1Id,
      tenant_id: 'tenant-alsea',
      user_id: 'user-ana',
      user_name: 'Ana Laura Cruz',
      user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      user_role: 'Líder de Cajas Polanco',
      content: 'Comentario de prueba con lenguaje no permitido moderado por la supervisión.',
      is_hidden: true,
      hidden_at: new Date(now.getTime() - 1800000).toISOString(),
      hidden_by: 'Roberto Gómez (Gerente)',
      hidden_reason: 'Contenido no relevante para la operación según política de moderación interna.',
      created_at: new Date(now.getTime() - 3600000).toISOString()
    }
  ];

  // Seed Notifications
  const notifications: NoticeNotification[] = [
    {
      id: 'notif-1',
      notice_id: notice1Id,
      tenant_id: 'tenant-alsea',
      user_id: 'user-roberto',
      title: 'Aviso Crítico: Protocolo de Seguridad y Control de Cajas',
      category_name: 'Operación',
      priority: 'critical',
      is_read: true,
      created_at: yesterday,
      message: 'Se ha publicado una actualización prioritaria con carácter obligatorio.',
      type: 'notice_published'
    },
    {
      id: 'notif-2',
      notice_id: notice1Id,
      tenant_id: 'tenant-alsea',
      user_id: 'user-ana',
      title: 'Aviso Crítico: Protocolo de Seguridad y Control de Cajas',
      category_name: 'Operación',
      priority: 'critical',
      is_read: false,
      created_at: yesterday,
      message: 'Se ha publicado una actualización prioritaria para tu sucursal.',
      type: 'notice_published'
    },
    {
      id: 'notif-3',
      notice_id: notice2Id,
      tenant_id: 'tenant-alsea',
      user_id: 'user-ana',
      title: 'Póliza de Gastos Médicos Mayores 2026',
      category_name: 'Corporativo',
      priority: 'important',
      is_read: false,
      created_at: yesterday,
      message: 'Nuevo comunicado corporativo disponible para todo el personal.',
      type: 'notice_published'
    }
  ];

  const initialDb: DatabaseSchema = {
    tenants: INITIAL_TENANTS,
    branches: INITIAL_BRANCHES,
    roles: INITIAL_ROLES,
    users: INITIAL_USERS,
    categories: allCats,
    notices: [notice1, notice2, notice3, notice4, notice5],
    versions,
    recipients,
    attachments,
    comments,
    notifications,
    audit_logs: []
  };

  saveDatabase(initialDb);
  return initialDb;
}
