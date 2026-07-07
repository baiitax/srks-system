


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."block_audit_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RAISE EXCEPTION 'Database Governance Policy Violation: The System Audit Log is an immutable ledger.';
END;
$$;


ALTER FUNCTION "public"."block_audit_mutation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT role FROM public.users_profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_po_ledgers"("target_po_id" "uuid", "po_cost" numeric, "freight_cost" numeric DEFAULT 0) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    fetched_logistics TEXT;
BEGIN
    SELECT logistics_type INTO fetched_logistics FROM public.purchase_orders WHERE id = target_po_id;

    -- 1. Debit Customer Receivables (Calculated with 7.5% Nigerian Corporate VAT)
    INSERT INTO public.financial_ledgers (po_id, account_type, debit, credit)
    VALUES (target_po_id, 'customer', (po_cost + freight_cost) * 1.075, 0.00);

    -- 2. Credit Product Vendor Liabilities Account (Accounts Payable)
    INSERT INTO public.financial_ledgers (po_id, account_type, debit, credit)
    VALUES (target_po_id, 'vendor', 0.00, po_cost);

    -- 3. Dynamic Conditional Track: Split Freight obligation if 3PL channel configuration is flagged
    IF fetched_logistics = '3pl' AND freight_cost > 0 THEN
        INSERT INTO public.financial_ledgers (po_id, account_type, debit, credit)
        VALUES (target_po_id, '3pl', 0.00, freight_cost);
    END IF;
END;
$$;


ALTER FUNCTION "public"."initialize_po_ledgers"("target_po_id" "uuid", "po_cost" numeric, "freight_cost" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_name" "text" NOT NULL,
    "delivery_address_default" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "po_id" "uuid",
    "type" "text" NOT NULL,
    "storage_url" "text" NOT NULL,
    "uploaded_by" "uuid",
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "documents_type_check" CHECK (("type" = ANY (ARRAY['invoice'::"text", 'vendor_waybill'::"text", 'company_waybill'::"text", 'grn'::"text"])))
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_ledgers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "po_id" "uuid",
    "account_type" "text" NOT NULL,
    "debit" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "credit" numeric(15,2) DEFAULT 0.00 NOT NULL,
    "is_cleared" boolean DEFAULT false NOT NULL,
    "reconciled_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "financial_ledgers_account_type_check" CHECK (("account_type" = ANY (ARRAY['vendor'::"text", 'customer'::"text", '3pl'::"text", 'supplier'::"text"])))
);


ALTER TABLE "public"."financial_ledgers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."po_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "po_id" "uuid",
    "product_id" "uuid",
    "quantity" numeric(15,4) NOT NULL,
    "unit_price" numeric(15,2) NOT NULL,
    "total_amount" numeric(15,2) GENERATED ALWAYS AS (("quantity" * "unit_price")) STORED,
    CONSTRAINT "po_items_quantity_check" CHECK (("quantity" > (0)::numeric)),
    CONSTRAINT "po_items_unit_price_check" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."po_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "sku" "text" NOT NULL,
    "category" "text" NOT NULL,
    "uom" "text" NOT NULL,
    "size_spec" "text" NOT NULL,
    "packaging_type" "text" NOT NULL,
    "default_currency" "text" DEFAULT 'NGN'::"text" NOT NULL,
    "is_vat_applicable" boolean DEFAULT true NOT NULL,
    "wht_rate" numeric(4,2) DEFAULT 5.00 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "products_category_check" CHECK (("category" = ANY (ARRAY['raw_materials'::"text", 'mro_spares'::"text", 'chemicals'::"text", 'packaging'::"text", 'finished_goods'::"text"]))),
    CONSTRAINT "products_default_currency_check" CHECK (("default_currency" = ANY (ARRAY['NGN'::"text", 'USD'::"text"]))),
    CONSTRAINT "products_packaging_type_check" CHECK (("packaging_type" = ANY (ARRAY['bulk'::"text", 'jumbo_bag'::"text", 'standard_bag'::"text", 'drum'::"text"]))),
    CONSTRAINT "products_uom_check" CHECK (("uom" = ANY (ARRAY['metric_tons'::"text", 'kilograms'::"text", 'liters'::"text", 'pieces'::"text"]))),
    CONSTRAINT "products_wht_rate_check" CHECK (("wht_rate" = ANY (ARRAY[0.00, 5.00, 10.00])))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "po_number" "text" NOT NULL,
    "status" "text" DEFAULT 'shell'::"text" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "vendor_id" "uuid",
    "logistics_type" "text",
    "tpl_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "purchase_orders_logistics_type_check" CHECK (("logistics_type" = ANY (ARRAY['vendor'::"text", '3pl'::"text"]))),
    CONSTRAINT "purchase_orders_status_check" CHECK (("status" = ANY (ARRAY['shell'::"text", 'issued'::"text", 'in_transit'::"text", 'delivered'::"text", 'reconciled'::"text", 'variance_hold'::"text"])))
);


ALTER TABLE "public"."purchase_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_audit_log" (
    "id" bigint NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid" NOT NULL,
    "ip_address" "text" DEFAULT '127.0.0.1'::"text" NOT NULL,
    "action_type" "text" NOT NULL,
    "target_entity_id" "uuid" NOT NULL,
    "change_manifest" "jsonb" NOT NULL
);


ALTER TABLE "public"."system_audit_log" OWNER TO "postgres";


ALTER TABLE "public"."system_audit_log" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."system_audit_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."third_party_logistics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "carrier_name" "text" NOT NULL,
    "git_insurance_policy" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."third_party_logistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users_profiles" (
    "id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "users_profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'agent'::"text"])))
);


ALTER TABLE "public"."users_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_name" "text" NOT NULL,
    "rc_number" "text",
    "nigerian_tin" "text",
    "payment_terms_default" "text" DEFAULT 'Net 30'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vendors" OWNER TO "postgres";


ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_company_name_key" UNIQUE ("company_name");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_ledgers"
    ADD CONSTRAINT "financial_ledgers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."po_items"
    ADD CONSTRAINT "po_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_po_number_key" UNIQUE ("po_number");



ALTER TABLE ONLY "public"."system_audit_log"
    ADD CONSTRAINT "system_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."third_party_logistics"
    ADD CONSTRAINT "third_party_logistics_carrier_name_key" UNIQUE ("carrier_name");



ALTER TABLE ONLY "public"."third_party_logistics"
    ADD CONSTRAINT "third_party_logistics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users_profiles"
    ADD CONSTRAINT "users_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_company_name_key" UNIQUE ("company_name");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_documents_po_id" ON "public"."documents" USING "btree" ("po_id");



CREATE INDEX "idx_ledgers_po_id" ON "public"."financial_ledgers" USING "btree" ("po_id");



CREATE INDEX "idx_po_items_po_id" ON "public"."po_items" USING "btree" ("po_id");



CREATE INDEX "idx_purchase_orders_customer" ON "public"."purchase_orders" USING "btree" ("customer_id");



CREATE INDEX "idx_purchase_orders_vendor" ON "public"."purchase_orders" USING "btree" ("vendor_id");



CREATE OR REPLACE TRIGGER "lock_audit_history" BEFORE DELETE OR UPDATE OR TRUNCATE ON "public"."system_audit_log" FOR EACH STATEMENT EXECUTE FUNCTION "public"."block_audit_mutation"();



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users_profiles"("id");



ALTER TABLE ONLY "public"."financial_ledgers"
    ADD CONSTRAINT "financial_ledgers_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."po_items"
    ADD CONSTRAINT "po_items_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."po_items"
    ADD CONSTRAINT "po_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users_profiles"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_tpl_id_fkey" FOREIGN KEY ("tpl_id") REFERENCES "public"."third_party_logistics"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id");



CREATE POLICY "Admin full visibility on Financial Balances" ON "public"."financial_ledgers" TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "Admin write access to products" ON "public"."products" TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "Agent lookup on catalog" ON "public"."products" FOR SELECT TO "authenticated" USING (("public"."get_user_role"() = 'agent'::"text"));



CREATE POLICY "Pipeline document uploads access controls" ON "public"."documents" TO "authenticated" USING (true);



CREATE POLICY "Pipeline visualization rules for active orders" ON "public"."purchase_orders" TO "authenticated" USING ((("public"."get_user_role"() = 'admin'::"text") OR (("public"."get_user_role"() = 'agent'::"text") AND ("status" <> 'shell'::"text"))));



ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_ledgers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."po_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."third_party_logistics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendors" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."block_audit_mutation"() TO "anon";
GRANT ALL ON FUNCTION "public"."block_audit_mutation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."block_audit_mutation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_po_ledgers"("target_po_id" "uuid", "po_cost" numeric, "freight_cost" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_po_ledgers"("target_po_id" "uuid", "po_cost" numeric, "freight_cost" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_po_ledgers"("target_po_id" "uuid", "po_cost" numeric, "freight_cost" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";


















GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."financial_ledgers" TO "anon";
GRANT ALL ON TABLE "public"."financial_ledgers" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_ledgers" TO "service_role";



GRANT ALL ON TABLE "public"."po_items" TO "anon";
GRANT ALL ON TABLE "public"."po_items" TO "authenticated";
GRANT ALL ON TABLE "public"."po_items" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_orders" TO "anon";
GRANT ALL ON TABLE "public"."purchase_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_orders" TO "service_role";



GRANT ALL ON TABLE "public"."system_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."system_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."system_audit_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."system_audit_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."system_audit_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."system_audit_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."third_party_logistics" TO "anon";
GRANT ALL ON TABLE "public"."third_party_logistics" TO "authenticated";
GRANT ALL ON TABLE "public"."third_party_logistics" TO "service_role";



GRANT ALL ON TABLE "public"."users_profiles" TO "anon";
GRANT ALL ON TABLE "public"."users_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."users_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."vendors" TO "anon";
GRANT ALL ON TABLE "public"."vendors" TO "authenticated";
GRANT ALL ON TABLE "public"."vendors" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";


