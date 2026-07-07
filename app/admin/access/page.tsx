"use client";

import { useState, useEffect } from "react";
import { Shield, Trash2, UserPlus, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
import { 
  getOperatorsAction, 
  provisionOperatorAction, 
  updateOperatorRoleAction, 
  revokeOperatorAction 
} from "./actions";

export default function IdentityAccessManagementDashboard() {
  const [operators, setOperators] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("agent");

  // Interaction States
  const [uiLoading, setUiLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadDirectory();
  }, []);

  async function loadDirectory() {
    setUiLoading(true);
    const result = await getOperatorsAction();
    if (result.success) setOperators(result.data);
    setUiLoading(false);
  }

  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);

    const result = await provisionOperatorAction({ fullName, email, password, role });
    
    setActionLoading(false);
    if (!result.success) {
      setMessage({ type: "error", text: result.error || "Provisioning failure." });
    } else {
      setMessage({ type: "success", text: "Identity created and token verified successfully." });
      setFullName("");
      setEmail("");
      setPassword("");
      loadDirectory();
    }
  }

  async function handleRoleMutation(userId: string, targetRole: "admin" | "agent") {
    const result = await updateOperatorRoleAction(userId, targetRole);
    if (result.success) {
      loadDirectory();
    } else {
      alert(`Role mutation error: ${result.error}`);
    }
  }

  async function handleRevocation(userId: string, name: string) {
    if (!confirm(`CRITICAL WARNING: Are you certain you want to revoke all clearance parameters and access capabilities for ${name}?`)) return;
    
    const result = await revokeOperatorAction(userId);
    if (result.success) {
      loadDirectory();
    } else {
      alert(`Revocation processing error: ${result.error}`);
    }
  }

  const filteredOperators = operators.filter(op => 
    op.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    op.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white p-6 md:p-12 font-sans antialiased selection:bg-slate-900 selection:text-white text-slate-900">
      
      {/* Top Identity Block */}
      <div className="border-b border-slate-100 pb-6 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Identity & Access Management (IAM)</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Configure operational node execution roles and platform credentials.</p>
        </div>
        <button onClick={loadDirectory} className="p-2 text-slate-400 hover:text-slate-900 transition-colors border border-slate-200 rounded-md shadow-sm cursor-pointer">
          <RefreshCw className={`w-4 h-4 ${uiLoading ? 'animate-spin text-slate-900' : ''}`} />
        </button>
      </div>

      {/* Primary Split Console Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* LEFT COLUMN: User Profile Directory (Takes 2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="w-full max-w-xs">
            <input
              type="text"
              placeholder="Search operators or tracking roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 transition-all shadow-sm"
            />
          </div>

          <div className="border border-slate-200/80 rounded-lg overflow-hidden shadow-sm bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Operator Clearance Identification</th>
                  <th className="px-5 py-3.5">Assigned Core Role</th>
                  <th className="px-5 py-3.5 text-right">Revocation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {uiLoading ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-12 text-center text-slate-400 font-medium">Refreshing network node directories...</td>
                  </tr>
                ) : filteredOperators.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-12 text-center text-slate-400 font-medium">No system configurations match search requirements.</td>
                  </tr>
                ) : (
                  filteredOperators.map((op) => (
                    <tr key={op.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{op.full_name}</div>
                        <div className="font-mono text-[10px] text-slate-400 mt-0.5 select-all">{op.id}</div>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={op.role}
                          onChange={(e) => handleRoleMutation(op.id, e.target.value as any)}
                          className="px-2 py-1 border border-slate-200 rounded bg-white text-[11px] font-bold tracking-wide uppercase text-slate-800 focus:outline-none focus:border-slate-950 cursor-pointer"
                        >
                          <option value="agent">Agent (Logistics)</option>
                          <option value="admin">Admin (Finance)</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleRevocation(op.id, op.full_name)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded transition-colors duration-150 inline-flex items-center cursor-pointer"
                          title="Revoke Node Credentials"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: Provisioning Panel (Takes 1/3 width) */}
        <div className="lg:col-span-1 border border-slate-200 rounded-lg p-5 bg-slate-50/40 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
            <UserPlus className="w-4 h-4 text-slate-900" />
            <h2 className="text-sm font-bold tracking-tight text-slate-900">Provision Operator Node</h2>
          </div>

          {/* Action Dynamic Messages */}
          {message && (
            <div className={`p-3 border rounded-md flex items-start gap-2 text-xs font-medium ${
              message.type === "error" ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}>
              {message.type === "error" ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleProvision} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Full Legal Name</label>
              <input
                type="text"
                required
                disabled={actionLoading}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs font-medium bg-white focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 disabled:opacity-50"
                placeholder="e.g. Aliko Dangote"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Corporate Email Route</label>
              <input
                type="email"
                required
                disabled={actionLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs font-medium bg-white focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 disabled:opacity-50"
                placeholder="operator@company.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Initial Account Password</label>
              <input
                type="password"
                required
                disabled={actionLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs font-medium bg-white focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 disabled:opacity-50"
                placeholder="Minimum 8 characters"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Clearance Authorization Role</label>
              <select
                value={role}
                disabled={actionLoading}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs font-bold bg-white uppercase text-slate-800 focus:outline-none focus:border-slate-950 disabled:opacity-50 cursor-pointer"
              >
                <option value="agent">Agent (Field Logistics)</option>
                <option value="admin">Admin (Corporate Finance)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-xs font-semibold text-white bg-slate-950 hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.99] shadow-sm cursor-pointer mt-2"
            >
              {actionLoading ? "Processing Encryption Payload..." : "Inject New Operator"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
