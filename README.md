# SRKS | Enterprise Procurement & Supply Record-Keeping System

**SRKS** is a heavy-industry logistics and financial ledger platform designed for multi-billion-dollar conglomerates. It provides a cryptographically secure, end-to-end supply chain architecture bridging the gap between operational field logistics and corporate financial reconciliation.

## 🏗 System Architecture

The application operates on a strict **Role-Based Access Control (RBAC)** model, dividing the system into two distinct environments:

### 1. Management Command Center (Global Admins)
A high-density, Bloomberg-style desktop interface for executives and finance officers.
* **PO Factory:** Initialize unpriced requisition shells and assign supply vendors.
* **Finance Match Station:** A strict "Maker-Checker" compliance gateway. Admins visually cross-reference field-uploaded PDFs against system data before authorizing ledger entries.
* **Master Corporate Ledger:** An immutable, double-entry accounting feed tracking Accounts Payable (AP) and Accounts Receivable (AR) in real-time.
* **Variance Resolution:** Issue credit/debit notes with mandated audit justifications for short deliveries or discrepancies.
* **Enterprise Reporting:** Dynamic aggregation of supplier expenditure and pipeline status.

### 2. Field Operations Hub (Logistics Agents)
A constrained, mobile-first native app experience designed for high-glare environments (ports, factory gates).
* **Mission Control:** Visual timelines connecting pickup origins to drop-off destinations.
* **Document Upload:** Direct-to-storage uploads for Supplier Invoices, Vendor Waybills, and Final GRNs.
* **QR-Secured Outbound Passes:** System-generated Waybills for gate security clearance.

---

## 💻 Tech Stack

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Turbopack)
* **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Edge Functions, RPCs, Storage)
* **Styling:** Tailwind CSS
* **UI Primitives:** Shadcn UI (Radix)
* **Iconography:** Lucide React
* **Typography:** Inter (System-default sans-serif for optimized load times)

---

## 🔒 Security & Compliance

SRKS is built with Big-4 audit compliance in mind:
* **No "Blind" Automation:** Field agents cannot write directly to the financial ledger. Uploaded Goods Received Notes (GRNs) trigger a `pending_finance_review` state.
* **Immutable Ledgers:** Financial entries are executed via secure PostgreSQL Remote Procedure Calls (RPCs), completely bypassing client-side logic.
* **System Audit Log:** (Database Level) PostgreSQL `FOR EACH STATEMENT` triggers prevent any `UPDATE` or `DELETE` commands on critical financial tables.

---

## 🚀 Local Development Setup

### 1. Clone the repository
```bash
git clone [https://github.com/baiitax/srks-system.git](https://github.com/baiitax/srks-system.git)
cd srks-system