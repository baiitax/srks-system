# TASK OVERVIEW
You are to design and build the `AdminLayout` (Sidebar + Topbar) and the `AdminDashboardPage` (Executive KPI view) for the SRKS system. This is a Tier-1 enterprise application. The design must look like a high-end financial terminal (think Bloomberg meets modern AWS). 

# TECH STACK
Next.js 15, Tailwind CSS, Shadcn UI (Card, Table, Badge, Avatar, ScrollArea), Lucide React (Icons), and Recharts (for data visualization).

---

### PART 1: THE ADMIN SIDEBAR (`app/admin/layout.tsx`)
Design a fixed, full-height sidebar (`w-64` or `w-72`) with a stark, dark corporate aesthetic (`bg-slate-950 text-slate-300`). 
Requirements:
1. Brand Header: A highly professional logo block at the top. Use a Lucide `Server` icon. Text: "SRKS Management". Include a tiny green badge that says "PROD" to indicate the live environment.
2. Navigation Hierarchy: Group links logically with subtle uppercase headers (e.g., `text-[10px] uppercase tracking-widest text-slate-500 mb-2`). 
   - Group 1: ANALYTICS (Executive Dashboard, Financial Ledgers).
   - Group 2: OPERATIONS (PO Factory, Vendor Directory, Product Vault).
   - Group 3: GOVERNANCE (System Audit Log, Access Control).
3. Link Styling: Active links must have a subtle background (`bg-emerald-900/50`) and an emerald left-border highlight (`border-l-2 border-emerald-500`). Inactive links must hover to `text-white bg-slate-900`. Use perfectly aligned Lucide icons for every link.
4. Bottom Footer: A user profile block utilizing Shadcn `<Avatar>` showing the Admin's initials, their role ("Global Admin"), and a subtle logout button.

---

### PART 2: THE EXECUTIVE DASHBOARD (`app/admin/page.tsx`)
Design a high-density, analytical landing page. Do not use generic whitespace. Maximize the viewport.
Requirements:

1. Page Header: 
   - Left: "Executive Command Center" with current date/time context.
   - Right: A primary action button ("+ Initialize Shell PO") and a secondary "Export Report" button.

2. Row 1: Top-Level KPI Cards (4 columns):
   - Use Shadcn `<Card>`. Each card must have: a title, a Lucide icon, the primary massive metric (e.g., "₦4.2B"), and a sub-metric showing a percentage trend (e.g., "+12.5% vs last month" in green).
   - Metrics to display: Total Reconciled Spend, Active Logistics Pipeline, Variance Hold Rate (Alert in Red if > 5%), and Registered Vendors.

3. Row 2: Analytical Split (Grid cols 3):
   - Left (Col-span-2): A massive Recharts `AreaChart` or `BarChart` showing "Monthly Procurement Volume". Use the corporate brand colors (Emerald and Slate). Ensure the tooltip and axes look clean and use custom NGN currency formatting.
   - Right (Col-span-1): "Action Required" panel. A list of 3-4 POs currently stuck in `variance_hold`. Use dense, compact rows showing the PO number, vendor, and a red "Resolve" button. 

4. Row 3: Live Pipeline Table:
   - A highly detailed Shadcn `<Table>` showing the 5 most recent active POs.
   - Columns: Reference ID, Destination, Vendor, Value (₦), Status (Use strict badge styling: Emerald for Reconciled, Blue for Issued, Amber for Shell).

# DESIGN CONSTRAINTS
- Stick strictly to the Emerald (`emerald-700`) and Slate (`slate-900`, `slate-50`) palette. 
- Use `shadow-sm` and `border-slate-200` for all cards. 
- Keep padding tight (`p-4` or `p-5` on cards) to allow executives to see all data without scrolling.
- Generate realistic, professional mock data for the charts and tables so the layout can be visualized perfectly immediately.