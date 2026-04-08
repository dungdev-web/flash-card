// src/app/hooks/usePermissions.ts
// Hook tập trung toàn bộ logic phân quyền theo role

"use client";

import { useRole } from "./useRole";

export interface Permissions {
  // Từ vựng
  maxWords:       number;   // Infinity = không giới hạn
  maxTopics:      number;

  // Tính năng AI
  canUseAiChat:   boolean;
  canUseVoice:    boolean;
  canAutoTranslate: boolean;
  canGenerateExample: boolean;

  // Tính năng nâng cao
  canExportAnki:  boolean;
  canUseSRS:      boolean;      // Spaced Repetition System
  canUseSakuraOverlay: boolean;

  // Admin
  canAccessAdmin: boolean;
  canManageRoles: boolean;
}

const FREE_PERMISSIONS: Permissions = {
  maxWords:            50,
  maxTopics:           3,
  canUseAiChat:        false,
  canUseVoice:         false,
  canAutoTranslate:    false,
  canGenerateExample:  false,
  canExportAnki:       false,
  canUseSRS:           false,
  canUseSakuraOverlay: false,
  canAccessAdmin:      false,
  canManageRoles:      false,
};

const PRO_PERMISSIONS: Permissions = {
  maxWords:            Infinity,
  maxTopics:           Infinity,
  canUseAiChat:        true,
  canUseVoice:         false,
  canAutoTranslate:    true,
  canGenerateExample:  true,
  canExportAnki:       false,
  canUseSRS:           false,
  canUseSakuraOverlay: true,
  canAccessAdmin:      false,
  canManageRoles:      false,
};

const MASTER_PERMISSIONS: Permissions = {
  maxWords:            Infinity,
  maxTopics:           Infinity,
  canUseAiChat:        true,
  canUseVoice:         true,
  canAutoTranslate:    true,
  canGenerateExample:  true,
  canExportAnki:       true,
  canUseSRS:           true,
  canUseSakuraOverlay: true,
  canAccessAdmin:      false,
  canManageRoles:      false,
};

const ADMIN_PERMISSIONS: Permissions = {
  ...MASTER_PERMISSIONS,
  canAccessAdmin:  true,
  canManageRoles:  true,
};

export function usePermissions() {
  const { role, loading } = useRole();

  const permissions: Permissions =
    role === "admin"  ? ADMIN_PERMISSIONS  :
    role === "master" ? MASTER_PERMISSIONS :
    role === "pro"    ? PRO_PERMISSIONS    :
                        FREE_PERMISSIONS;

  return { permissions, role, loading };
}