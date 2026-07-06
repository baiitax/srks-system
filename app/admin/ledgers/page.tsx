import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Download, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

// Helper to format Nigerian Naira securely
const formatNGN = (amount: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

export default async function LedgersPage() {
  const supabase = await createClient();

  // 1. Fetch the immutable financial ledgers
  // Assuming the RPC created entries with account_type (AP/AR), transaction_type (CREDIT/DEBIT), and amount
  const { data: ledgers } = await supabase
    .from("financial_ledgers")
    .select(`
      id,
      created_at,
      account_type,
      transaction_type,
      amount,
      description,
      purchase_orders (po_number, vendors(company_name), customers(company_name))
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  // 2. Aggregate Live Financial Balances
  let totalAccountsPayable = 0;   // Money we owe vendors
  let totalAccountsReceivable = 0; // Money clients owe us
  let totalThroughput = 0;

  ledgers?.forEach((entry) => {
    const value = Number(entry.amount);
    totalThroughput += value;
    if (entry.account_type === 'PAYABLE') totalAccountsPayable += value;
    if (entry.account_type === 'RECEIVABLE') totalAccountsReceivable += value;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER CONTEXT */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Master Financial Ledgers</h2>
          <p className="text-slate-500">Immutable double-entry accounting records synced with physical deliveries.</p>
        </div>
        <div className="flex space-x-3 w-full md:w-auto">
          <Button variant="outline" className="h-10 w-full md:w-auto border-slate-300 text-slate-700 bg-white">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* FINANCIAL KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Accounts Payable (Liability) */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Accounts Payable (AP)</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatNGN(totalAccountsPayable)}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center">
              <ArrowDownRight className="w-3 h-3 mr-1 text-red-500" />
              Outstanding vendor liabilities
            </p>
          </CardContent>
        </Card>

        {/* Accounts Receivable (Asset) */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Accounts Receivable (AR)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatNGN(totalAccountsReceivable)}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1 text-emerald-500" />
              Uninvoiced client capital
            </p>
          </CardContent>
        </Card>

        {/* Total Ledger Throughput */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">30-Day Throughput</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatNGN(totalThroughput)}</div>
            <p className="text-xs text-slate-500 mt-1">Total volume matched & booked</p>
          </CardContent>
        </Card>
      </div>

      {/* DOUBLE-ENTRY LEDGER TABLE */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-slate-800 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-slate-500" />
                Live Transaction Ledger
              </CardTitle>
              <CardDescription>Chronological feed of all automated ledger postings.</CardDescription>
            </div>
            
            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search PO Reference or Entity..." 
                className="pl-9 h-10 bg-white border-slate-300 focus-visible:ring-emerald-600 shadow-sm"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="py-4 pl-6 font-semibold text-slate-700">Timestamp</TableHead>
                <TableHead className="font-semibold text-slate-700">PO Reference</TableHead>
                <TableHead className="font-semibold text-slate-700">Entity / Account</TableHead>
                <TableHead className="font-semibold text-slate-700">Entry Type</TableHead>
                <TableHead className="text-right pr-6 font-semibold text-slate-700">Amount (₦)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgers?.map((entry) => {
                // 🚨 ADDED : any to bypass strict relational inference
                const poData: any = Array.isArray(entry.purchase_orders) ? entry.purchase_orders[0] : entry.purchase_orders;
                
                // Determine Entity based on AP/AR
                const isPayable = entry.account_type === 'PAYABLE';
                const entityName = isPayable 
                  ? (Array.isArray(poData?.vendors) ? poData.vendors[0]?.company_name : poData?.vendors?.company_name)
                  : (Array.isArray(poData?.customers) ? poData.customers[0]?.company_name : poData?.customers?.company_name);
                // Styling logic for Credits vs Debits
                const isCredit = entry.transaction_type === 'CREDIT';

                return (
                  <TableRow key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Timestamp */}
                    <TableCell className="pl-6 align-top pt-4">
                      <div className="font-mono text-xs text-slate-600">
                        {new Date(entry.created_at).toLocaleString('en-GB', { 
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' 
                        })}
                      </div>
                      <div className="font-mono text-[9px] text-slate-400 mt-1 uppercase">
                        TXN: {entry.id.split('-')[0]}
                      </div>
                    </TableCell>
                    
                    {/* Reference */}
                    <TableCell className="align-top pt-4">
                      <div className="inline-flex items-center px-2 py-1 rounded bg-slate-100 border border-slate-200 font-mono text-xs font-semibold text-slate-800">
                        {poData?.po_number || 'SYSTEM'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1.5 max-w-[200px] truncate">
                        {entry.description}
                      </div>
                    </TableCell>

                    {/* Account Type & Entity */}
                    <TableCell className="align-top pt-4">
                      <div className="font-medium text-slate-900 text-sm">
                        {entityName || 'Internal Transfer'}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                        {entry.account_type.replace('_', ' ')}
                      </div>
                    </TableCell>
                    
                    {/* Debit/Credit Badge */}
                    <TableCell className="align-top pt-4">
                      <Badge variant="outline" className={
                        isCredit 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm font-bold' 
                          : 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm font-bold'
                      }>
                        <span className="flex items-center uppercase tracking-widest text-[10px]">
                          {isCredit ? 'CREDIT' : 'DEBIT'}
                        </span>
                      </Badge>
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="text-right pr-6 align-top pt-4">
                      <div className={`font-mono font-bold text-base ${isCredit ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {isCredit ? '+' : ''}{formatNGN(Number(entry.amount))}
                      </div>
                    </TableCell>
                    
                  </TableRow>
                );
              })}
              
              {(!ledgers || ledgers.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <BookOpen className="w-10 h-10 text-slate-300" />
                      <span>No financial ledgers generated yet. Clear POs through the Match Station.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}