import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/shared/submit-button";
import { DownloadPdfButton } from "@/components/shared/download-pdf-button";
import { CheckCircle2, UploadCloud, Lock, ArrowLeft, Receipt, FileText, ClipboardSignature } from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function AgentDocumentHubPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const poId = resolvedParams.id;
  const supabase = await createClient();

  const { data: po } = await supabase
    .from("purchase_orders")
    .select(`*, customers (company_name), vendors (company_name), documents (type, storage_url)`)
    .eq("id", poId)
    .single();

  if (!po) return <div className="p-8 text-center text-red-600">Mission data unavailable.</div>;

  const getDoc = (docType: string) => po.documents?.find((d: any) => d.type === docType);
  const invoice = getDoc("invoice");
  const vendorWaybill = getDoc("vendor_waybill");
  const grn = getDoc("grn");
  
  // Added "pending_finance_review" to the delivered states so the UI knows the Agent's job is done
  const isDelivered = po.status === "delivered" || po.status === "reconciled" || po.status === "variance_hold" || po.status === "pending_finance_review";

  // --- SERVER ACTION ---
  async function handleFileUpload(formData: FormData) {
    "use server";
    const supabaseServer = await createClient();
    const file = formData.get("file") as File;
    const docType = formData.get("docType") as string;
    const targetPoId = formData.get("poId") as string;

    if (!file || file.size === 0) return;
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const fileExt = file.name.split('.').pop();
    const fileName = `${targetPoId}-${docType}-${Date.now()}.${fileExt}`;
    
    // Upload to Supabase Storage
    await supabaseServer.storage.from("procurement-docs").upload(fileName, file);
    const { data: publicUrlData } = supabaseServer.storage.from("procurement-docs").getPublicUrl(fileName);

    // Save document record
    await supabaseServer.from("documents").insert([{
      po_id: targetPoId, type: docType, storage_url: publicUrlData.publicUrl, uploaded_by: user.id
    }]);

    // Update PO Status based on document
    let newStatus = po.status;
    if (docType === "vendor_waybill") newStatus = "in_transit";
    
    // 🚨 THE FIX: Hand over to Finance, do not touch the ledger!
    if (docType === "grn") newStatus = "pending_finance_review";

    if (newStatus !== po.status) {
      await supabaseServer.from("purchase_orders").update({ status: newStatus }).eq("id", targetPoId);
    }

    revalidatePath(`/agent/upload/${targetPoId}`);
  }
  // --- END SERVER ACTION ---

  return (
    <div className="space-y-4">
      {/* App-Style Header Navigation */}
      <div className="flex items-center mb-6">
        <Link href="/agent/dashboard" className="p-2 bg-white rounded-full shadow-sm mr-3 active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-none">{po.po_number}</h2>
          <p className="text-xs text-slate-500 mt-1 truncate w-48">{po.customers?.company_name}</p>
        </div>
      </div>

      {/* 1. SUPPLIER INVOICE */}
      <Card className={`rounded-2xl border-0 shadow-sm ${invoice ? 'bg-emerald-50' : 'bg-white'}`}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${invoice ? 'bg-emerald-200/50' : 'bg-slate-100'}`}>
                <Receipt className={`w-5 h-5 ${invoice ? 'text-emerald-700' : 'text-slate-500'}`} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Supplier Invoice</h3>
                <p className="text-[10px] text-slate-500">Commercial pricing document</p>
              </div>
            </div>
            {invoice && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          </div>

          {invoice ? (
            <div className="text-xs font-bold text-emerald-700 bg-emerald-100 p-3 rounded-xl text-center uppercase tracking-widest">
              Verified & Locked
            </div>
          ) : (
            <form action={handleFileUpload} className="space-y-3">
              <input type="hidden" name="poId" value={poId} />
              <input type="hidden" name="docType" value="invoice" />
              <Input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png" className="bg-slate-50 border-slate-200 h-12 rounded-xl text-sm" />
              <SubmitButton className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl" icon={<UploadCloud className="w-4 h-4" />}>
                Upload Document
              </SubmitButton>
            </form>
          )}
        </CardContent>
      </Card>

      {/* 2. VENDOR WAYBILL */}
      <Card className={`rounded-2xl border-0 shadow-sm ${vendorWaybill ? 'bg-emerald-50' : 'bg-white'}`}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${vendorWaybill ? 'bg-emerald-200/50' : 'bg-slate-100'}`}>
                <FileText className={`w-5 h-5 ${vendorWaybill ? 'text-emerald-700' : 'text-slate-500'}`} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Vendor Waybill</h3>
                <p className="text-[10px] text-slate-500">Proof of pickup dispatch</p>
              </div>
            </div>
            {vendorWaybill && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          </div>

          {vendorWaybill ? (
            <div className="text-xs font-bold text-emerald-700 bg-emerald-100 p-3 rounded-xl text-center uppercase tracking-widest">
              Verified & Locked
            </div>
          ) : (
            <form action={handleFileUpload} className="space-y-3">
              <input type="hidden" name="poId" value={poId} />
              <input type="hidden" name="docType" value="vendor_waybill" />
              <Input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png" className="bg-slate-50 border-slate-200 h-12 rounded-xl text-sm" />
              <SubmitButton className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl" icon={<UploadCloud className="w-4 h-4" />}>
                Upload Document
              </SubmitButton>
            </form>
          )}
        </CardContent>
      </Card>

      {/* 3. OUTBOUND COMPANY WAYBILL */}
      <Card className={`rounded-2xl border-0 shadow-sm ${vendorWaybill ? 'bg-teal-700' : 'bg-slate-100'}`}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${vendorWaybill ? 'bg-teal-600' : 'bg-slate-200'}`}>
                {vendorWaybill ? <FileText className="w-5 h-5 text-white" /> : <Lock className="w-5 h-5 text-slate-400" />}
              </div>
              <div>
                <h3 className={`font-bold ${vendorWaybill ? 'text-white' : 'text-slate-500'}`}>System Waybill</h3>
                <p className={`text-[10px] ${vendorWaybill ? 'text-teal-200' : 'text-slate-400'}`}>QR-Secured Outbound Pass</p>
              </div>
            </div>
          </div>

          {!vendorWaybill ? (
            <div className="text-xs font-bold text-slate-400 bg-slate-200/50 p-3 rounded-xl text-center uppercase tracking-widest">
              Locked
            </div>
          ) : (
            <DownloadPdfButton poData={po} docType="COMPANY_WAYBILL" label="Save Secure PDF" className="w-full h-12 bg-white text-teal-800 hover:bg-teal-50 rounded-xl font-bold" />
          )}
        </CardContent>
      </Card>

      {/* 4. CLIENT GRN */}
      <Card className={`rounded-2xl border-0 shadow-sm mb-8 ${grn ? 'bg-emerald-50' : 'bg-white'}`}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${grn ? 'bg-emerald-200/50' : 'bg-slate-100'}`}>
                <ClipboardSignature className={`w-5 h-5 ${grn ? 'text-emerald-700' : 'text-slate-500'}`} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Final GRN</h3>
                <p className="text-[10px] text-slate-500">Client signed delivery receipt</p>
              </div>
            </div>
            {grn && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          </div>

          {grn || isDelivered ? (
            <div className="text-xs font-bold text-emerald-700 bg-emerald-100 p-3 rounded-xl text-center uppercase tracking-widest">
              Reviewing in Finance
            </div>
          ) : (
            <form action={handleFileUpload} className="space-y-3">
              <input type="hidden" name="poId" value={poId} />
              <input type="hidden" name="docType" value="grn" />
              <Input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png" disabled={!vendorWaybill} className="bg-slate-50 border-slate-200 h-12 rounded-xl text-sm" />
              <SubmitButton disabled={!vendorWaybill} className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl" icon={<UploadCloud className="w-4 h-4" />}>
                Submit to Finance
              </SubmitButton>
            </form>
          )}
        </CardContent>
      </Card>

    </div>
  );
}