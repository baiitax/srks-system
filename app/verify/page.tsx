import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildVerificationPayload, generateDocumentHash } from "@/lib/utils/crypto";

type VerifySearchParams = {
  hash?: string;
  po?: string;
  docType?: string;
  issuedAt?: string;
};

const ALLOWED_DOC_TYPES = ["PURCHASE_ORDER", "COMPANY_WAYBILL"];

function relationCompanyName(
  relation: { company_name?: string } | { company_name?: string }[] | null | undefined
) {
  if (Array.isArray(relation)) {
    return relation[0]?.company_name || "";
  }
  return relation?.company_name || "";
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<VerifySearchParams>;
}) {
  const params = await searchParams;
  const hash = params.hash?.trim() || "";
  const poNumber = params.po?.trim() || "";
  const docType = params.docType?.trim() || "";
  const issuedAt = params.issuedAt?.trim() || "";

  const hasBasicParams = Boolean(hash && poNumber && issuedAt && ALLOWED_DOC_TYPES.includes(docType));

  if (!hasBasicParams) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-xl border-red-200">
          <CardHeader>
            <Badge className="bg-red-100 text-red-800 w-fit">INVALID REQUEST</Badge>
            <CardTitle className="text-2xl">Verification parameters are incomplete.</CardTitle>
            <CardDescription>Check the QR code source and scan again.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: po } = await supabase
    .from("purchase_orders")
    .select(`
      po_number,
      customers (company_name),
      vendors (company_name)
    `)
    .eq("po_number", poNumber)
    .single();

  if (!po) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-xl border-red-200">
          <CardHeader>
            <Badge className="bg-red-100 text-red-800 w-fit">NOT FOUND</Badge>
            <CardTitle className="text-2xl">Purchase order reference was not found.</CardTitle>
            <CardDescription>The presented paper document is not linked to an active SRKS record.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const payload = buildVerificationPayload({
    poNumber,
    vendorName: relationCompanyName(po.vendors),
    customerName: relationCompanyName(po.customers),
    docType,
    issuedAt,
  });

  const expectedHash = await generateDocumentHash(payload);
  const isValid = expectedHash === hash;

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-slate-200 shadow-sm">
        <CardHeader>
          <Badge className={isValid ? "bg-emerald-100 text-emerald-800 w-fit" : "bg-red-100 text-red-800 w-fit"}>
            {isValid ? "AUTHENTIC" : "TAMPERED OR INVALID"}
          </Badge>
          <CardTitle className="text-2xl">SRKS Document Verification</CardTitle>
          <CardDescription>
            This result confirms whether the scanned document still matches the cryptographic payload issued by SRKS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-700">
          <p>
            PO Reference: <strong>{poNumber}</strong>
          </p>
          <p>
            Document Type: <strong>{docType}</strong>
          </p>
          <p>
            Issued At: <strong>{new Date(issuedAt).toLocaleString()}</strong>
          </p>
          <p>
            Vendor: <strong>{relationCompanyName(po.vendors) || "N/A"}</strong>
          </p>
          <p>
            Customer: <strong>{relationCompanyName(po.customers) || "N/A"}</strong>
          </p>
          {!isValid && (
            <p className="rounded-md bg-red-50 border border-red-200 p-3 text-red-700">
              Warning: The hash from the scanned document does not match the active SRKS record for this PO and timestamp.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
