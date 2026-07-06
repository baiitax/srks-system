"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const allowedDocTypes = ["invoice", "vendor_waybill", "grn"] as const;

const uploadPayloadSchema = z.object({
  poId: z.string().uuid(),
  docType: z.enum(allowedDocTypes),
  amountDeclared: z.number().nonnegative().optional(),
  quantityDeclared: z.number().nonnegative().optional(),
  freightCostDeclared: z.number().nonnegative().optional(),
});

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

async function requireAgentRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, error: "Unauthorized" as const };
  }

  const { data: profile, error: roleError } = await supabase
    .from("users_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (roleError || profile?.role !== "agent") {
    return { supabase, error: "Forbidden" as const };
  }

  return { supabase, user };
}

function toOptionalPositiveNumber(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return undefined;
  }
  return parsed;
}

function toTotalAmount(item: { total_amount?: number | null; quantity?: number | null; unit_price?: number | null }) {
  if (item.total_amount !== null && item.total_amount !== undefined) {
    return Number(item.total_amount);
  }
  return Number(item.quantity || 0) * Number(item.unit_price || 0);
}

async function getLatestUploadManifest(
  supabase: Awaited<ReturnType<typeof createClient>>,
  poId: string,
  docType: (typeof allowedDocTypes)[number]
) {
  const { data } = await supabase
    .from("system_audit_log")
    .select("change_manifest")
    .eq("action_type", "AGENT_DOC_UPLOAD")
    .eq("target_entity_id", poId)
    .order("created_at", { ascending: false })
    .limit(20);

  const manifest = data
    ?.map((entry) => entry.change_manifest as Record<string, unknown>)
    .find((entry) => entry?.doc_type === docType);

  return manifest;
}

// 1. AGENT UPLOADS DOCUMENT
export async function uploadDocument(formData: FormData) {
  const auth = await requireAgentRole();
  if ("error" in auth) throw new Error(auth.error);

  const supabase = auth.supabase;
  const { user } = auth;

  const rawPayload = {
    poId: formData.get("poId") as string,
    docType: formData.get("docType") as (typeof allowedDocTypes)[number],
    amountDeclared: toOptionalPositiveNumber(formData.get("amountDeclared")),
    quantityDeclared: toOptionalPositiveNumber(formData.get("quantityDeclared")),
    freightCostDeclared: toOptionalPositiveNumber(formData.get("freightCostDeclared")),
  };

  const parsed = uploadPayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    throw new Error("Invalid upload payload");
  }

  const payload = parsed.data;
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("A file is required");
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error("File size must be 10MB or less");
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("Unsupported file type");
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const safeExt = ["pdf", "jpg", "jpeg", "png"].includes(fileExt) ? fileExt : "pdf";
  const fileName = `${payload.poId}-${payload.docType}-${crypto.randomUUID()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage.from("procurement-docs").upload(fileName, file);

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage.from("procurement-docs").getPublicUrl(fileName);
  const fileUrl = publicUrlData.publicUrl;

  // Insert document reference
  const { error } = await supabase.from("documents").insert([{ 
    po_id: payload.poId,
    type: payload.docType,
    storage_url: fileUrl,
    uploaded_by: user.id
  }]);

  if (error) throw new Error(error.message);

  await supabase.from("system_audit_log").insert([
    {
      user_id: user.id,
      action_type: "AGENT_DOC_UPLOAD",
      target_entity_id: payload.poId,
      change_manifest: {
        doc_type: payload.docType,
        amount_declared: payload.amountDeclared ?? null,
        quantity_declared: payload.quantityDeclared ?? null,
        freight_cost_declared: payload.freightCostDeclared ?? null,
        storage_url: fileUrl,
      },
    },
  ]);

  // State Machine: Update PO Status based on document uploaded
  let newStatus = "";
  if (payload.docType === "vendor_waybill") newStatus = "in_transit";
  if (payload.docType === "grn") newStatus = "delivered";

  if (newStatus) {
    await supabase.from("purchase_orders").update({ status: newStatus }).eq("id", payload.poId);
  }

  // IF GRN is uploaded, Trigger the 3-Way Match Engine automatically
  if (payload.docType === "grn") {
    await executeThreeWayMatch(payload.poId);
  }

  revalidatePath(`/agent/upload/${payload.poId}`);
  revalidatePath("/agent/dashboard");
  revalidatePath("/admin/ledgers");
}

// 2. THE 3-WAY MATCH & LEDGER AUTOMATION ENGINE
async function executeThreeWayMatch(poId: string) {
  const supabase = await createClient();

  const { data: po, error: poError } = await supabase
    .from("purchase_orders")
    .select("id, logistics_type")
    .eq("id", poId)
    .single();

  if (poError || !po) {
    return;
  }

  const { data: items, error: itemError } = await supabase
    .from("po_items")
    .select("quantity, unit_price, total_amount")
    .eq("po_id", poId);

  if (itemError || !items || items.length === 0) {
    await supabase.from("purchase_orders").update({ status: "variance_hold" }).eq("id", poId);
    return;
  }

  const expectedTotalAmount = items.reduce((sum, item) => sum + toTotalAmount(item), 0);
  const expectedTotalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const { data: docs } = await supabase
    .from("documents")
    .select("type")
    .eq("po_id", poId)
    .in("type", ["invoice", "grn", "vendor_waybill"]);

  const hasInvoice = docs?.some((doc) => doc.type === "invoice") ?? false;
  const hasGRN = docs?.some((doc) => doc.type === "grn") ?? false;
  const hasWaybill = docs?.some((doc) => doc.type === "vendor_waybill") ?? false;

  if (!hasInvoice || !hasGRN || !hasWaybill) {
    await supabase.from("purchase_orders").update({ status: "variance_hold" }).eq("id", poId);
    return;
  }

  const invoiceManifest = await getLatestUploadManifest(supabase, poId, "invoice");
  const grnManifest = await getLatestUploadManifest(supabase, poId, "grn");
  const waybillManifest = await getLatestUploadManifest(supabase, poId, "vendor_waybill");

  const invoiceAmountDeclared = Number(invoiceManifest?.amount_declared ?? Number.NaN);
  const grnQuantityDeclared = Number(grnManifest?.quantity_declared ?? Number.NaN);
  const freightCostDeclared = Number(waybillManifest?.freight_cost_declared ?? Number.NaN);

  const tolerance = 0.01;
  const invoiceMatches =
    Number.isFinite(invoiceAmountDeclared) &&
    Math.abs(invoiceAmountDeclared - expectedTotalAmount) <= tolerance;
  const quantityMatches =
    Number.isFinite(grnQuantityDeclared) &&
    Math.abs(grnQuantityDeclared - expectedTotalQuantity) <= tolerance;

  const freightCost =
    po.logistics_type === "3pl"
      ? Number.isFinite(freightCostDeclared) && freightCostDeclared > 0
        ? freightCostDeclared
        : Number.NaN
      : 0;

  const freightMatches = po.logistics_type === "3pl" ? Number.isFinite(freightCost) : true;

  if (!invoiceMatches || !quantityMatches || !freightMatches) {
    await supabase.from("purchase_orders").update({ status: "variance_hold" }).eq("id", poId);
    return;
  }

  const { error: rpcError } = await supabase.rpc("initialize_po_ledgers", {
    target_po_id: poId,
    po_cost: expectedTotalAmount,
    freight_cost: freightCost,
  });

  if (rpcError) {
    await supabase.from("purchase_orders").update({ status: "variance_hold" }).eq("id", poId);
    return;
  }

  await supabase.from("purchase_orders").update({ status: "reconciled" }).eq("id", poId);
}