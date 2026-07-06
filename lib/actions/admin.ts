"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().trim().min(2),
  sku: z.string().trim().min(2),
  category: z.string().trim().min(1),
  uom: z.string().trim().min(1),
  size_spec: z.string().trim().min(2),
  packaging_type: z.string().trim().min(1),
  default_currency: z.string().trim().min(1),
  is_vat_applicable: z.boolean(),
  wht_rate: z.number().min(0).max(100),
});

const shellPOSchema = z.object({
  customerId: z.string().uuid(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().positive(),
      })
    )
    .min(1),
});

const activateSchema = z.object({
  poId: z.string().uuid(),
  vendorId: z.string().uuid(),
  logisticsType: z.enum(["vendor", "3pl"]),
  tplId: z.string().uuid().optional(),
  itemUpdates: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        unitPrice: z.number().positive(),
      })
    )
    .optional(),
});

async function requireAdminRole() {
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

  if (roleError || profile?.role !== "admin") {
    return { supabase, error: "Forbidden" as const };
  }

  return { supabase, user };
}

// 1. CREATE MASTER PRODUCT
export async function createProduct(formData: FormData) {
  const auth = await requireAdminRole();
  if ("error" in auth) throw new Error(auth.error);

  const supabase = auth.supabase;

  const rawProductData = {
    name: formData.get("name") as string,
    sku: formData.get("sku") as string,
    category: formData.get("category") as string,
    uom: formData.get("uom") as string,
    size_spec: formData.get("size_spec") as string,
    packaging_type: formData.get("packaging_type") as string,
    default_currency: formData.get("default_currency") as string,
    is_vat_applicable: formData.get("is_vat_applicable") === "true",
    wht_rate: Number(formData.get("wht_rate")),
  };

  const parsed = productSchema.safeParse(rawProductData);
  if (!parsed.success) {
    throw new Error("Invalid product payload");
  }

  const { error } = await supabase.from("products").insert([parsed.data]);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
}

// 2. STAGE 1: INITIALIZE SHELL PO
export async function createShellPO(customerId: string, items: { productId: string; quantity: number }[]) {
  const auth = await requireAdminRole();
  if ("error" in auth) throw new Error(auth.error);

  const supabase = auth.supabase;
  const { user } = auth;

  const parsed = shellPOSchema.safeParse({ customerId, items });
  if (!parsed.success) {
    throw new Error("Invalid shell PO payload");
  }

  // Generate a unique PO Number
  const poNumber = `PO-${new Date().getFullYear()}-SHL-${Math.floor(1000 + Math.random() * 9000)}`;

  // Insert the PO header
  const { data: po, error: poError } = await supabase
    .from("purchase_orders")
    .insert([{
      po_number: poNumber,
      status: "shell",
      customer_id: parsed.data.customerId,
      created_by: user.id
    }])
    .select("id")
    .single();

  if (poError) throw new Error(poError.message);

  // Map and insert the line items with 0 unit_price (locked in Shell state)
  const poItems = parsed.data.items.map(item => ({
    po_id: po.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: 0
  }));

  const { error: itemsError } = await supabase.from("po_items").insert(poItems);
  
  if (itemsError) throw new Error(itemsError.message);

  revalidatePath("/admin/po");
  return { poId: po.id };
}

// 3. STAGE 2: ACTIVATE PO & ASSIGN VENDOR
export async function activatePO(
  poId: string, 
  vendorId: string, 
  logisticsType: 'vendor' | '3pl', 
  tplId?: string, 
  itemUpdates?: { itemId: string, unitPrice: number }[]
) {
  const auth = await requireAdminRole();
  if ("error" in auth) throw new Error(auth.error);

  const supabase = auth.supabase;
  const { user } = auth;

  const parsed = activateSchema.safeParse({ poId, vendorId, logisticsType, tplId, itemUpdates });
  if (!parsed.success) {
    throw new Error("Invalid PO activation payload");
  }

  const activation = parsed.data;

  // A. Update the PO Header
  const { error: poError } = await supabase
    .from("purchase_orders")
    .update({
      status: "issued",
      vendor_id: activation.vendorId,
      logistics_type: activation.logisticsType,
      tpl_id: activation.tplId || null,
      po_number: `PO-${new Date().getFullYear()}-ACT-${Math.floor(1000 + Math.random() * 9000)}` // Change SHL to ACT
    })
    .eq("id", activation.poId);

  if (poError) throw new Error(poError.message);

  // B. Update the pricing on line items
  if (activation.itemUpdates && activation.itemUpdates.length > 0) {
    for (const item of activation.itemUpdates) {
      await supabase.from("po_items").update({ unit_price: item.unitPrice }).eq("id", item.itemId);
    }
  }

  // C. Log the action in the Immutable Audit Log
  await supabase.from("system_audit_log").insert([{
    user_id: user.id,
    action_type: "PO_STAGE2_ACTIVATION",
    target_entity_id: activation.poId,
    change_manifest: {
      vendor_id: activation.vendorId,
      status: "issued",
      logistics_type: activation.logisticsType,
      tpl_id: activation.tplId || null,
      item_updates_count: activation.itemUpdates?.length || 0,
    }
  }]);

  revalidatePath("/admin/po");
}