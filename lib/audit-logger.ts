import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

// Initialize the privileged administrative superuser client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type SystemEventType = 
  | "AUTH_LOGIN_SUCCESS" 
  | "AUTH_LOGIN_FAILED" 
  | "AUTH_LOGOUT"
  | "IAM_NODE_PROVISIONED"
  | "IAM_ACCESS_REVOKED";

interface AuditPayload {
  actionType: SystemEventType;
  userId?: string; 
  targetEntityId?: string;
  changeManifest?: Record<string, any>;
}

// System fallback for strict NOT NULL UUID columns when tracking unauthenticated failures
const SYSTEM_NIL_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * Enterprise Compliance Audit Logger
 * Asynchronously writes immutable security events matching your exact DB schema.
 */
export async function logSystemEvent({ actionType, userId, targetEntityId, changeManifest }: AuditPayload) {
  try {
    const headersList = await headers();
    
    // Extract Edge Network Identifiers safely
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : headersList.get("x-real-ip") || "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "unknown_device";

    // Inject into the immutable ledger using your EXACT schema columns
    const { error } = await supabaseAdmin.from("system_audit_log").insert({
      user_id: userId || SYSTEM_NIL_UUID,
      ip_address: ipAddress,
      action_type: actionType,
      target_entity_id: targetEntityId || userId || SYSTEM_NIL_UUID,
      change_manifest: {
        ...(changeManifest || {}),
        user_agent: userAgent
      },
    });

    if (error) {
      console.error("CRITICAL [AUDIT_LOG_FAILURE]: Ledger write rejected.", error.message);
    }
  } catch (err) {
    console.error("CRITICAL [AUDIT_LOG_EXCEPTION]:", err);
  }
}