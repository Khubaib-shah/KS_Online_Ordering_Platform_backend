--
-- PostgreSQL database dump
--

\restrict YEWFOfFvnnO4p6OWfm4C4BcC1k50q1KiJXSHKzJ8iftXrnDcoRtRRTPJ4AOR7tu

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: storeuser
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO storeuser;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: storeuser
--

COMMENT ON SCHEMA public IS '';


--
-- Name: BusinessType; Type: TYPE; Schema: public; Owner: storeuser
--

CREATE TYPE public."BusinessType" AS ENUM (
    'RESTAURANT',
    'FAST_FOOD',
    'CAFE',
    'ICE_CREAM_PARLOUR',
    'BAKERY',
    'CLOUD_KITCHEN',
    'RETAIL'
);


ALTER TYPE public."BusinessType" OWNER TO storeuser;

--
-- Name: Designation; Type: TYPE; Schema: public; Owner: storeuser
--

CREATE TYPE public."Designation" AS ENUM (
    'OWNER',
    'BRANCH_MANAGER',
    'CASHIER',
    'KITCHEN_STAFF',
    'RIDER',
    'GENERAL_STAFF'
);


ALTER TYPE public."Designation" OWNER TO storeuser;

--
-- Name: DiscountType; Type: TYPE; Schema: public; Owner: storeuser
--

CREATE TYPE public."DiscountType" AS ENUM (
    'PERCENTAGE',
    'FIXED_AMOUNT',
    'FREE_DELIVERY'
);


ALTER TYPE public."DiscountType" OWNER TO storeuser;

--
-- Name: FulfillmentType; Type: TYPE; Schema: public; Owner: storeuser
--

CREATE TYPE public."FulfillmentType" AS ENUM (
    'DINE_IN',
    'TAKEAWAY',
    'DELIVERY'
);


ALTER TYPE public."FulfillmentType" OWNER TO storeuser;

--
-- Name: GlobalRole; Type: TYPE; Schema: public; Owner: storeuser
--

CREATE TYPE public."GlobalRole" AS ENUM (
    'SUPER_ADMIN',
    'TENANT_USER'
);


ALTER TYPE public."GlobalRole" OWNER TO storeuser;

--
-- Name: LoyaltyTier; Type: TYPE; Schema: public; Owner: storeuser
--

CREATE TYPE public."LoyaltyTier" AS ENUM (
    'BRONZE',
    'SILVER',
    'GOLD',
    'PLATINUM'
);


ALTER TYPE public."LoyaltyTier" OWNER TO storeuser;

--
-- Name: OrderChannel; Type: TYPE; Schema: public; Owner: storeuser
--

CREATE TYPE public."OrderChannel" AS ENUM (
    'POS',
    'STOREFRONT',
    'KITCHEN_MANUAL',
    'THIRD_PARTY'
);


ALTER TYPE public."OrderChannel" OWNER TO storeuser;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: storeuser
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'PREPARING',
    'READY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."OrderStatus" OWNER TO storeuser;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: storeuser
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'COD',
    'CARD',
    'ONLINE',
    'WALLET',
    'BANK_TRANSFER',
    'LOYALTY_POINTS'
);


ALTER TYPE public."PaymentMethod" OWNER TO storeuser;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: storeuser
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'UNPAID',
    'PAID',
    'REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO storeuser;

--
-- Name: PermissionLevel; Type: TYPE; Schema: public; Owner: storeuser
--

CREATE TYPE public."PermissionLevel" AS ENUM (
    'NONE',
    'READ',
    'MANAGE'
);


ALTER TYPE public."PermissionLevel" OWNER TO storeuser;

--
-- Name: TenantStatus; Type: TYPE; Schema: public; Owner: storeuser
--

CREATE TYPE public."TenantStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'PENDING_PAYMENT'
);


ALTER TYPE public."TenantStatus" OWNER TO storeuser;

--
-- Name: TicketPriority; Type: TYPE; Schema: public; Owner: storeuser
--

CREATE TYPE public."TicketPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."TicketPriority" OWNER TO storeuser;

--
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: storeuser
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
);


ALTER TYPE public."TicketStatus" OWNER TO storeuser;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO storeuser;

--
-- Name: branches; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.branches (
    id text NOT NULL,
    tenant_id text NOT NULL,
    name character varying(255) NOT NULL,
    address text NOT NULL,
    phone character varying(50),
    is_active boolean DEFAULT true NOT NULL,
    opening_time character varying(10),
    closing_time character varying(10),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.branches OWNER TO storeuser;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.categories (
    id text NOT NULL,
    tenant_id text NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    image_url jsonb,
    card_style character varying(20),
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO storeuser;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.customers (
    id text NOT NULL,
    tenant_id text NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(50) NOT NULL,
    is_guest boolean DEFAULT true NOT NULL,
    loyalty_points integer DEFAULT 0 NOT NULL,
    tier public."LoyaltyTier" DEFAULT 'BRONZE'::public."LoyaltyTier" NOT NULL,
    total_orders integer DEFAULT 0 NOT NULL,
    total_spent numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.customers OWNER TO storeuser;

--
-- Name: delivery_zones; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.delivery_zones (
    id text NOT NULL,
    branch_id text NOT NULL,
    area_name character varying(255) NOT NULL,
    city character varying(255) NOT NULL,
    delivery_fee numeric(10,2) DEFAULT 0 NOT NULL,
    estimated_minutes integer DEFAULT 45 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.delivery_zones OWNER TO storeuser;

--
-- Name: global_areas; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.global_areas (
    id text NOT NULL,
    city character varying(100) NOT NULL,
    region character varying(100) NOT NULL,
    name character varying(100) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.global_areas OWNER TO storeuser;

--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.menu_items (
    id text NOT NULL,
    tenant_id text NOT NULL,
    category_id text NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    image_url jsonb,
    base_price numeric(10,2) NOT NULL,
    discounted_price numeric(10,2),
    badge_text character varying(100),
    badge_color character varying(20),
    meta_note character varying(255),
    price_prefix character varying(50),
    deal_layout boolean DEFAULT false NOT NULL,
    calories integer,
    preparation_time_mins integer DEFAULT 15 NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.menu_items OWNER TO storeuser;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    order_id text NOT NULL,
    menu_item_id text,
    item_name character varying(255) NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    selected_variants jsonb,
    item_note text,
    total_price numeric(10,2) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.order_items OWNER TO storeuser;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.orders (
    id text NOT NULL,
    order_number character varying(50) NOT NULL,
    tenant_id text NOT NULL,
    branch_id text NOT NULL,
    customer_id text,
    channel public."OrderChannel" NOT NULL,
    fulfillment_type public."FulfillmentType" NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    payment_method public."PaymentMethod" NOT NULL,
    payment_status public."PaymentStatus" DEFAULT 'UNPAID'::public."PaymentStatus" NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0 NOT NULL,
    delivery_fee numeric(10,2) DEFAULT 0 NOT NULL,
    grand_total numeric(10,2) NOT NULL,
    delivery_address text,
    nearest_landmark text,
    delivery_instructions text,
    table_number character varying(20),
    special_instructions text,
    private_kitchen_notes text,
    status_timeline jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.orders OWNER TO storeuser;

--
-- Name: platform_plans; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.platform_plans (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    monthly_price numeric(10,2) NOT NULL,
    max_branches integer NOT NULL,
    max_menu_items integer NOT NULL,
    transaction_fee_pct numeric(5,2) DEFAULT 0 NOT NULL,
    features_json jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.platform_plans OWNER TO storeuser;

--
-- Name: pos_devices; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.pos_devices (
    id text NOT NULL,
    tenant_id text NOT NULL,
    branch_id text NOT NULL,
    device_id text NOT NULL,
    computer_name character varying(255),
    socket_id character varying(255),
    version character varying(50),
    status character varying(50) DEFAULT 'offline'::character varying NOT NULL,
    os character varying(100),
    local_ip character varying(50),
    last_seen timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pos_devices OWNER TO storeuser;

--
-- Name: print_history; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.print_history (
    id text NOT NULL,
    tenant_id text NOT NULL,
    branch_id text NOT NULL,
    device_id text,
    printer_id text,
    type character varying(50) NOT NULL,
    status character varying(50) NOT NULL,
    payload jsonb,
    error text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.print_history OWNER TO storeuser;

--
-- Name: print_jobs; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.print_jobs (
    id text NOT NULL,
    tenant_id text NOT NULL,
    branch_id text NOT NULL,
    device_id text,
    printer_id text,
    type character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    payload jsonb,
    error text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.print_jobs OWNER TO storeuser;

--
-- Name: printers; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.printers (
    id text NOT NULL,
    tenant_id text NOT NULL,
    branch_id text NOT NULL,
    name character varying(255) NOT NULL,
    is_receipt boolean DEFAULT false NOT NULL,
    is_kitchen boolean DEFAULT false NOT NULL,
    is_label boolean DEFAULT false NOT NULL,
    driver character varying(50) NOT NULL,
    vendor_id character varying(100),
    product_id character varying(100),
    ip character varying(50),
    port integer,
    paper_width integer DEFAULT 80 NOT NULL,
    status character varying(50) DEFAULT 'offline'::character varying NOT NULL,
    last_heartbeat timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.printers OWNER TO storeuser;

--
-- Name: promotions; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.promotions (
    id text NOT NULL,
    tenant_id text NOT NULL,
    code character varying(50) NOT NULL,
    discount_type public."DiscountType" NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    min_order_amount numeric(10,2) DEFAULT 0 NOT NULL,
    max_discount_cap numeric(10,2),
    start_date timestamp(3) without time zone,
    end_date timestamp(3) without time zone,
    usage_limit integer,
    times_used integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.promotions OWNER TO storeuser;

--
-- Name: staff_profiles; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.staff_profiles (
    id text NOT NULL,
    user_id text NOT NULL,
    branch_id text,
    designation public."Designation" DEFAULT 'GENERAL_STAFF'::public."Designation" NOT NULL,
    permission_orders public."PermissionLevel" DEFAULT 'MANAGE'::public."PermissionLevel" NOT NULL,
    permission_menu public."PermissionLevel" DEFAULT 'READ'::public."PermissionLevel" NOT NULL,
    permission_reports public."PermissionLevel" DEFAULT 'NONE'::public."PermissionLevel" NOT NULL,
    permission_settings public."PermissionLevel" DEFAULT 'NONE'::public."PermissionLevel" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.staff_profiles OWNER TO storeuser;

--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.support_tickets (
    id text NOT NULL,
    tenant_id text NOT NULL,
    created_by_user_id text NOT NULL,
    subject character varying(255) NOT NULL,
    category character varying(100),
    priority public."TicketPriority" DEFAULT 'MEDIUM'::public."TicketPriority" NOT NULL,
    status public."TicketStatus" DEFAULT 'OPEN'::public."TicketStatus" NOT NULL,
    messages_json jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.support_tickets OWNER TO storeuser;

--
-- Name: tenant_content; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.tenant_content (
    id text NOT NULL,
    tenant_id text NOT NULL,
    announcement_text text,
    footer_config jsonb,
    copy_config jsonb,
    hero_slides jsonb,
    faqs jsonb,
    privacy_policy jsonb,
    seo_title character varying(255),
    seo_description text,
    active_promo jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tenant_content OWNER TO storeuser;

--
-- Name: tenant_settings; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.tenant_settings (
    id text NOT NULL,
    tenant_id text NOT NULL,
    currency_symbol character varying(10) DEFAULT 'Rs.'::character varying NOT NULL,
    currency_code character varying(10) DEFAULT 'PKR'::character varying NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0 NOT NULL,
    service_fee numeric(5,2) DEFAULT 0 NOT NULL,
    enable_dine_in boolean DEFAULT true NOT NULL,
    enable_takeaway boolean DEFAULT true NOT NULL,
    enable_delivery boolean DEFAULT true NOT NULL,
    enabled_payment_methods text[] DEFAULT ARRAY['CASH'::text, 'CARD'::text, 'ONLINE'::text],
    phone character varying(50),
    email character varying(255),
    address text,
    receipt_header text,
    receipt_footer text,
    stripe_public_key character varying(255),
    stripe_secret_key_enc text,
    delivery_fee numeric(10,2) DEFAULT 0 NOT NULL,
    min_order_value numeric(10,2) DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    delivery_areas jsonb,
    operating_hours jsonb
);


ALTER TABLE public.tenant_settings OWNER TO storeuser;

--
-- Name: tenant_themes; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.tenant_themes (
    id text NOT NULL,
    tenant_id text NOT NULL,
    primary_color character varying(20) DEFAULT '#0f172a'::character varying NOT NULL,
    accent_color character varying(20) DEFAULT '#3b82f6'::character varying NOT NULL,
    bg_color character varying(20) DEFAULT '#f8fafc'::character varying NOT NULL,
    logo_url jsonb,
    favicon_url jsonb,
    font_family character varying(100) DEFAULT 'Inter'::character varying NOT NULL,
    default_card_style character varying(20) DEFAULT 'default'::character varying NOT NULL,
    popular_card_style character varying(20) DEFAULT 'default'::character varying NOT NULL,
    category_background jsonb,
    background_image jsonb,
    background_mode character varying(20),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tenant_themes OWNER TO storeuser;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.tenants (
    id text NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(100) NOT NULL,
    custom_domain character varying(255),
    business_type public."BusinessType" NOT NULL,
    plan_id text,
    status public."TenantStatus" DEFAULT 'ACTIVE'::public."TenantStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tenants OWNER TO storeuser;

--
-- Name: users; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.users (
    id text NOT NULL,
    tenant_id text,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    avatar_url text,
    global_role public."GlobalRole" DEFAULT 'TENANT_USER'::public."GlobalRole" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO storeuser;

--
-- Name: variant_groups; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.variant_groups (
    id text NOT NULL,
    menu_item_id text NOT NULL,
    title character varying(255) NOT NULL,
    min_select integer DEFAULT 0 NOT NULL,
    max_select integer DEFAULT 1 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.variant_groups OWNER TO storeuser;

--
-- Name: variant_options; Type: TABLE; Schema: public; Owner: storeuser
--

CREATE TABLE public.variant_options (
    id text NOT NULL,
    variant_group_id text NOT NULL,
    name character varying(255) NOT NULL,
    price_modifier numeric(10,2) DEFAULT 0 NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.variant_options OWNER TO storeuser;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.branches (id, tenant_id, name, address, phone, is_active, opening_time, closing_time, created_at, updated_at) FROM stdin;
a0c8625c-9aaa-4d47-afcd-6d3a4a8ec54b	459daa11-c9e6-4baa-89c5-da4b8e29cbd2	Main Branch	Primary location	\N	t	\N	\N	2026-07-30 15:11:58.95	2026-07-30 15:11:58.95
e2a00869-a3e0-4e5e-b754-899df93350b7	e3d7089e-13e3-407c-9504-49c57f7bf44c	Main Branch	Primary location	\N	t	\N	\N	2026-08-02 16:21:06.257	2026-08-02 16:21:06.257
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.categories (id, tenant_id, name, slug, image_url, card_style, sort_order, is_active, created_at, updated_at) FROM stdin;
8e46447e-d0fb-48cc-bab5-662e336adf87	459daa11-c9e6-4baa-89c5-da4b8e29cbd2	Chicken Karahi	chicken-karahi	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1785427600/shopes/marhaba-bar-b-q-restaurant/Category/mtpm1lt94k3omyqbsrjw.png"	\N	99	t	2026-07-30 16:06:48.475	2026-07-30 16:06:48.475
3580273b-7e15-4f38-8fd8-aeb6379c5ef6	459daa11-c9e6-4baa-89c5-da4b8e29cbd2	Signature Bar B Q	signature-bar-b-q	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1785494807/shopes/marhaba-bar-b-q-restaurant/Category/pmfnu4mbyq6x1pjvqpuq.png"	\N	99	t	2026-07-31 10:47:26.737	2026-07-31 10:47:26.737
b25678d9-d573-42ca-aec1-d4afdb89d315	e3d7089e-13e3-407c-9504-49c57f7bf44c	Chai	chai	\N	\N	99	t	2026-08-02 16:22:28.664	2026-08-02 16:22:28.664
eec220fc-61ea-4ec1-9f72-02fb023d5110	e3d7089e-13e3-407c-9504-49c57f7bf44c	Anda	anda	\N	\N	99	t	2026-08-02 16:22:33.344	2026-08-02 16:22:33.344
0c8a7323-b3a8-4e0d-933e-942cad617bb0	e3d7089e-13e3-407c-9504-49c57f7bf44c	Paratha	paratha	\N	\N	99	t	2026-08-02 16:22:46.171	2026-08-02 16:22:46.171
0c941bdf-9111-4f7a-b2f2-d07a42df0168	e3d7089e-13e3-407c-9504-49c57f7bf44c	Fast Food	fast-food	\N	\N	99	t	2026-08-02 16:22:57.986	2026-08-02 16:22:57.986
2ebeffd4-a6ef-4f9c-a8eb-a6d6eafc2b57	e3d7089e-13e3-407c-9504-49c57f7bf44c	Tandoor Roti	tandoor-roti	\N	\N	99	t	2026-08-02 16:23:21.217	2026-08-02 16:23:21.217
a875d73c-459b-4aa5-aab4-fe24b64c656d	e3d7089e-13e3-407c-9504-49c57f7bf44c	Kadhi Chawal	kadhi-chawal	\N	\N	99	t	2026-08-02 16:23:48.455	2026-08-02 16:23:48.455
8c057c04-cdf4-4aa2-94d8-b65c803b5bbf	e3d7089e-13e3-407c-9504-49c57f7bf44c	Salad	salad	\N	\N	99	t	2026-08-02 16:24:35.926	2026-08-02 16:24:35.926
9ba135fb-80d4-4099-b504-0a437eeca074	e3d7089e-13e3-407c-9504-49c57f7bf44c	Nihari	nihari	\N	\N	99	t	2026-08-02 16:24:43.443	2026-08-02 16:24:43.443
49e23e2a-ed09-4ad6-bfd0-c73ff4948ec8	e3d7089e-13e3-407c-9504-49c57f7bf44c	Salan	salan	\N	\N	99	t	2026-08-02 16:24:55.161	2026-08-02 16:24:55.161
ab2624ae-878b-4b7c-8ae2-e4b85ea520e0	e3d7089e-13e3-407c-9504-49c57f7bf44c	Grill Chargha	grill-chargha	\N	\N	99	t	2026-08-02 16:25:10.712	2026-08-02 16:25:10.712
896bc99c-7953-4422-a798-5eaac257bd18	e3d7089e-13e3-407c-9504-49c57f7bf44c	Bar B.Q	bar-b-q	\N	\N	99	t	2026-08-02 16:25:29.599	2026-08-02 16:25:29.599
8ab60bdf-30d8-4246-a3bc-e1280b400378	e3d7089e-13e3-407c-9504-49c57f7bf44c	Roll	roll	\N	\N	99	t	2026-08-02 16:25:50.329	2026-08-02 16:25:50.329
1bb72993-a5a9-4bc1-a722-86fc6338b023	e3d7089e-13e3-407c-9504-49c57f7bf44c	Normal Flavour	normal-flavour	\N	\N	99	t	2026-08-02 16:26:38.73	2026-08-02 16:26:38.73
19a21d03-68c3-4e39-b144-bba0f41f3f7e	e3d7089e-13e3-407c-9504-49c57f7bf44c	Special Flavour	special-flavour	\N	\N	99	t	2026-08-02 16:26:48.781	2026-08-02 16:26:48.781
578dc9b4-eacb-4495-a13d-ec80f901355b	e3d7089e-13e3-407c-9504-49c57f7bf44c	Extra Special Flavours	extra-special-flavours	\N	\N	99	t	2026-08-02 16:27:10.443	2026-08-02 16:27:10.443
dc0ba29d-fdd5-4cbc-b2e1-fd3aa2c7973e	e3d7089e-13e3-407c-9504-49c57f7bf44c	Biryani & Pulao	biryani-pulao	\N	\N	99	t	2026-08-02 16:24:20.701	2026-08-02 16:27:19.942
5b5dae5e-c323-438c-89a3-dc9390e9900b	e3d7089e-13e3-407c-9504-49c57f7bf44c	Halwa Puri	halwa-puri	\N	\N	99	t	2026-08-02 16:41:52.921	2026-08-02 16:41:52.921
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.customers (id, tenant_id, name, email, phone, is_guest, loyalty_points, tier, total_orders, total_spent, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: delivery_zones; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.delivery_zones (id, branch_id, area_name, city, delivery_fee, estimated_minutes, is_active, created_at, updated_at) FROM stdin;
af3e9794-f9dd-47c2-8b60-0426107f4c0d	a0c8625c-9aaa-4d47-afcd-6d3a4a8ec54b			0.00	45	t	2026-08-02 15:44:41.239	2026-08-02 15:44:33.701
\.


--
-- Data for Name: global_areas; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.global_areas (id, city, region, name, is_active, created_at, updated_at) FROM stdin;
7e8c6850-bff5-436b-a2cd-70e24012854d	Karachi	DHA	PHASE 8	t	2026-08-02 06:45:13.69	2026-08-02 06:45:13.69
dd1e7fde-ca1e-4c0e-b4c0-8f91625040cd	Karachi	DHA	PHASE 2	t	2026-08-02 06:49:18.633	2026-08-02 06:49:18.633
f70a4da1-57f9-4e51-9f27-7dfd4d6970d0	Karachi	DHA	PHASE 3	t	2026-08-02 06:50:40.239	2026-08-02 06:50:40.239
cff0ca57-ff5c-4dac-88cc-8ee1a920815e	Karachi	Gulshan e Iqbal	Block 13 D	t	2026-08-02 07:24:08.837	2026-08-02 07:24:08.837
15c5d5f3-949c-426b-b513-0622d82aec58	Gulshan e Iqbal	Block 2	Imtiaz Shopping mall	t	2026-08-02 10:27:16.437	2026-08-02 10:27:16.437
\.


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.menu_items (id, tenant_id, category_id, name, description, image_url, base_price, discounted_price, badge_text, badge_color, meta_note, price_prefix, deal_layout, calories, preparation_time_mins, is_available, is_featured, sort_order, created_at, updated_at) FROM stdin;
30765eb7-df80-4908-b6b4-bd2af7f7f000	e3d7089e-13e3-407c-9504-49c57f7bf44c	2ebeffd4-a6ef-4f9c-a8eb-a6d6eafc2b57	Chapati	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	20.00	20.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:44:26.751	2026-08-02 16:44:26.751
c22f91b5-6681-4034-954c-fd2e19dad494	e3d7089e-13e3-407c-9504-49c57f7bf44c	2ebeffd4-a6ef-4f9c-a8eb-a6d6eafc2b57	Naan	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	25.00	25.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:44:39.278	2026-08-02 16:44:39.278
6a0b1674-4a95-47e8-a86a-09f18ee1ed6a	e3d7089e-13e3-407c-9504-49c57f7bf44c	a875d73c-459b-4aa5-aab4-fe24b64c656d	Kadhi Chawal	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	180.00	180.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:46:11.934	2026-08-02 16:49:01.029
b63f0ae3-529a-4de4-a4b4-ef3ee4f36719	e3d7089e-13e3-407c-9504-49c57f7bf44c	dc0ba29d-fdd5-4cbc-b2e1-fd3aa2c7973e	Chicken Biryani	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	180.00	180.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:47:32.013	2026-08-02 16:49:14.884
47437ab1-cc86-4d91-a01c-1a72796adeb1	459daa11-c9e6-4baa-89c5-da4b8e29cbd2	8e46447e-d0fb-48cc-bab5-662e336adf87	White Karahi	Descripptionsss	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1785479276/shopes/marhaba-bar-b-q-restaurant/Menu%20Item/xemfnyqj6f1vcpvwg8if.png"	1450.00	1250.00	Best Seller	\N	\N	\N	f	\N	15	t	t	1	2026-07-30 16:11:40.763	2026-07-31 06:29:48.393
3f947661-58de-49e9-9947-c944e2d4b546	459daa11-c9e6-4baa-89c5-da4b8e29cbd2	3580273b-7e15-4f38-8fd8-aeb6379c5ef6	Bar B Q Platter	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1785496978/shopes/marhaba-bar-b-q-restaurant/Menu%20Item/hawpjm6k3jumqk2rqpnc.png"	3500.00	3200.00	\N	\N	\N	\N	f	\N	15	t	t	1	2026-07-31 11:25:43.877	2026-07-31 11:25:43.877
0d81b6fb-f4fb-4508-9754-03e89a742e27	e3d7089e-13e3-407c-9504-49c57f7bf44c	b25678d9-d573-42ca-aec1-d4afdb89d315	Special Chai	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	100.00	100.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:33:27.656	2026-08-02 16:33:27.656
a071695c-4150-4333-82b7-8b420825f761	e3d7089e-13e3-407c-9504-49c57f7bf44c	b25678d9-d573-42ca-aec1-d4afdb89d315	Kawa Chai	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	150.00	150.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:34:08.958	2026-08-02 16:34:08.958
55192c08-804c-46f5-a428-f0dd17a76a7c	e3d7089e-13e3-407c-9504-49c57f7bf44c	b25678d9-d573-42ca-aec1-d4afdb89d315	Green Tea	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	100.00	100.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:34:36.171	2026-08-02 16:34:36.171
5c37370d-37fb-4b91-a490-63d15634f200	e3d7089e-13e3-407c-9504-49c57f7bf44c	b25678d9-d573-42ca-aec1-d4afdb89d315	Coffee	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	150.00	150.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:34:59.467	2026-08-02 16:34:59.467
6061e03e-89ca-41e2-a11d-63cd42f618f4	e3d7089e-13e3-407c-9504-49c57f7bf44c	b25678d9-d573-42ca-aec1-d4afdb89d315	Kashmiri Chai	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	200.00	200.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:35:25.104	2026-08-02 16:35:25.104
681166ff-a55b-4813-ab38-d1e6fc65c5c1	e3d7089e-13e3-407c-9504-49c57f7bf44c	eec220fc-61ea-4ec1-9f72-02fb023d5110	Normal Anda	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	60.00	60.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:35:54.982	2026-08-02 16:35:54.982
8bba73fb-b49c-4dd7-8d15-9e9abda33af2	e3d7089e-13e3-407c-9504-49c57f7bf44c	eec220fc-61ea-4ec1-9f72-02fb023d5110	Half Fry	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	60.00	60.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:36:08.755	2026-08-02 16:36:08.755
6afa6a94-3510-4455-b1ba-9356f4a93519	e3d7089e-13e3-407c-9504-49c57f7bf44c	0c8a7323-b3a8-4e0d-933e-942cad617bb0	Paratha	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	60.00	60.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:38:26.879	2026-08-02 16:38:26.879
46631cc8-2655-41d7-a2fb-42f310c2e009	e3d7089e-13e3-407c-9504-49c57f7bf44c	0c8a7323-b3a8-4e0d-933e-942cad617bb0	Anda Paratha	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	120.00	120.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:38:46.882	2026-08-02 16:38:46.882
a1e5cccb-2550-4b37-9b11-e03adf0eab95	e3d7089e-13e3-407c-9504-49c57f7bf44c	0c8a7323-b3a8-4e0d-933e-942cad617bb0	Aloo Paratha	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	200.00	200.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:39:09.761	2026-08-02 16:39:09.761
b2b5818a-d4b3-4b76-8bb3-3ecedf93d0bd	e3d7089e-13e3-407c-9504-49c57f7bf44c	0c8a7323-b3a8-4e0d-933e-942cad617bb0	Cheese Paratha	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	200.00	200.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:39:35.124	2026-08-02 16:39:35.124
2b3ca10d-6a2c-4908-93c4-07f3f90eabe4	e3d7089e-13e3-407c-9504-49c57f7bf44c	0c8a7323-b3a8-4e0d-933e-942cad617bb0	Chicken Paratha	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	300.00	300.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:39:58.882	2026-08-02 16:39:58.882
240e4c37-6781-4f90-a435-452ec2ae9c6b	e3d7089e-13e3-407c-9504-49c57f7bf44c	0c8a7323-b3a8-4e0d-933e-942cad617bb0	Chicken Cheese Paratha	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	350.00	350.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:40:26.68	2026-08-02 16:40:26.68
89b478f8-f40c-4c9c-bb2b-2102a7dd45e4	e3d7089e-13e3-407c-9504-49c57f7bf44c	5b5dae5e-c323-438c-89a3-dc9390e9900b	Halwa Puri	With Aloo Tarkari & Chana Tarkari	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	100.00	100.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:42:21.065	2026-08-02 16:42:21.065
91558efa-208d-41e0-b4de-f16b3caac3b4	e3d7089e-13e3-407c-9504-49c57f7bf44c	5b5dae5e-c323-438c-89a3-dc9390e9900b	Halwa	100 Gram Halwa	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	200.00	200.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:42:45.861	2026-08-02 16:42:45.861
dee7a72d-53b9-4a33-96c5-781e87cc1a82	e3d7089e-13e3-407c-9504-49c57f7bf44c	0c941bdf-9111-4f7a-b2f2-d07a42df0168	Zinger with Fries	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	500.00	500.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:44:04.301	2026-08-02 16:44:04.301
c858f770-2a84-4178-9df8-b5f0f28e9b59	e3d7089e-13e3-407c-9504-49c57f7bf44c	dc0ba29d-fdd5-4cbc-b2e1-fd3aa2c7973e	Chicken Pulao	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	180.00	180.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-02 16:51:02.626	2026-08-02 16:51:02.626
e0714f8e-fe45-4dac-98e5-4866168583b8	e3d7089e-13e3-407c-9504-49c57f7bf44c	9ba135fb-80d4-4099-b504-0a437eeca074	Nihari Half	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	350.00	350.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:05:47.939	2026-08-03 07:05:47.939
6f820037-416e-4ca2-944d-6f0a35063674	e3d7089e-13e3-407c-9504-49c57f7bf44c	9ba135fb-80d4-4099-b504-0a437eeca074	Nihari Full	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	700.00	700.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:06:05.976	2026-08-03 07:06:05.976
ae66a6d5-2413-44c9-aab3-f1985abe9474	e3d7089e-13e3-407c-9504-49c57f7bf44c	49e23e2a-ed09-4ad6-bfd0-c73ff4948ec8	Daal Chana	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	150.00	150.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:07:29.199	2026-08-03 07:07:29.199
15615cd1-55a1-4757-b2bf-93c5d7a9a56d	e3d7089e-13e3-407c-9504-49c57f7bf44c	49e23e2a-ed09-4ad6-bfd0-c73ff4948ec8	Daal Mash	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	150.00	150.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:08:18.199	2026-08-03 07:08:18.199
1598ca85-5a1f-4a7f-9f1c-f52083dc62f4	e3d7089e-13e3-407c-9504-49c57f7bf44c	49e23e2a-ed09-4ad6-bfd0-c73ff4948ec8	Mix Sabzi	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	150.00	150.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:09:32.395	2026-08-03 07:09:32.395
64f30cf7-760c-4847-86e1-b4f02f092a08	e3d7089e-13e3-407c-9504-49c57f7bf44c	49e23e2a-ed09-4ad6-bfd0-c73ff4948ec8	Chicken Karahi	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	200.00	200.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:10:36.96	2026-08-03 07:10:36.96
921c2901-6ad1-4585-abf0-2403a737edf6	e3d7089e-13e3-407c-9504-49c57f7bf44c	49e23e2a-ed09-4ad6-bfd0-c73ff4948ec8	Chicken Keema	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	200.00	200.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:11:21.785	2026-08-03 07:11:21.785
15ae24b2-5f4f-47bf-94be-f1ea213dc25c	e3d7089e-13e3-407c-9504-49c57f7bf44c	49e23e2a-ed09-4ad6-bfd0-c73ff4948ec8	Kadhi Pakora	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	150.00	150.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:12:00.297	2026-08-03 07:12:00.297
177521f3-ea38-4648-8af3-b9c052a0c8f0	e3d7089e-13e3-407c-9504-49c57f7bf44c	ab2624ae-878b-4b7c-8ae2-e4b85ea520e0	Grill Chargha Half	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	1100.00	1100.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:12:58.826	2026-08-03 07:12:58.826
dcb8d048-a8a1-4f97-9620-5f659dd33cfd	e3d7089e-13e3-407c-9504-49c57f7bf44c	ab2624ae-878b-4b7c-8ae2-e4b85ea520e0	Grill Chargha Full	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	2200.00	2200.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:13:41.569	2026-08-03 07:13:41.569
e906b4b8-cf24-4a14-b74d-255b3489cbb6	e3d7089e-13e3-407c-9504-49c57f7bf44c	896bc99c-7953-4422-a798-5eaac257bd18	Chicken Tikka Chest	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	400.00	400.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:14:59.316	2026-08-03 07:14:59.316
c511cc11-fb58-4e97-8941-37cc6ae5121f	e3d7089e-13e3-407c-9504-49c57f7bf44c	896bc99c-7953-4422-a798-5eaac257bd18	Chicken Tikka Leg	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	350.00	350.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:14:32.643	2026-08-03 07:15:14.093
bbd405b7-f9a8-436d-8e49-d12c543d7104	e3d7089e-13e3-407c-9504-49c57f7bf44c	896bc99c-7953-4422-a798-5eaac257bd18	Chicken Boti	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	500.00	500.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:16:12.838	2026-08-03 07:16:12.838
d3c9a476-319a-40a8-be43-fcad56df8b98	e3d7089e-13e3-407c-9504-49c57f7bf44c	896bc99c-7953-4422-a798-5eaac257bd18	Malai Boti	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	500.00	500.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:17:13.647	2026-08-03 07:17:13.647
d75deacd-be87-419f-97ee-a517e2fb0fc9	e3d7089e-13e3-407c-9504-49c57f7bf44c	896bc99c-7953-4422-a798-5eaac257bd18	Beef Behari Boti	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	500.00	500.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:17:40.025	2026-08-03 07:17:40.025
12627811-a895-4b2f-8896-6f21e11954a8	e3d7089e-13e3-407c-9504-49c57f7bf44c	896bc99c-7953-4422-a798-5eaac257bd18	Chicken Behari Boti	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	500.00	500.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:18:16.827	2026-08-03 07:18:16.827
8548ea32-4117-4381-ac93-339c812dff4e	e3d7089e-13e3-407c-9504-49c57f7bf44c	896bc99c-7953-4422-a798-5eaac257bd18	Shahi Chatka Boti	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	500.00	500.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:19:20.723	2026-08-03 07:19:20.723
09d018d4-cace-41ee-9fd5-97bdf01b9e29	e3d7089e-13e3-407c-9504-49c57f7bf44c	896bc99c-7953-4422-a798-5eaac257bd18	Beef Kabab	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	500.00	500.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:20:15.258	2026-08-03 07:20:15.258
24a26750-92f9-4248-ba28-fae7b528c23c	e3d7089e-13e3-407c-9504-49c57f7bf44c	896bc99c-7953-4422-a798-5eaac257bd18	Chicken Kabab	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	500.00	500.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:20:44.632	2026-08-03 07:20:44.632
1bd3792a-8d69-4ded-91e5-5d8a7efe79d7	e3d7089e-13e3-407c-9504-49c57f7bf44c	896bc99c-7953-4422-a798-5eaac257bd18	Reshmi Kabab	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	500.00	500.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:21:06.223	2026-08-03 07:21:06.223
ad51f3f7-fec0-4548-8d4b-0a95c53f7800	e3d7089e-13e3-407c-9504-49c57f7bf44c	896bc99c-7953-4422-a798-5eaac257bd18	Taka Kabab	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	500.00	500.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:21:27.644	2026-08-03 07:21:27.644
09e01e7e-26eb-4229-9a02-54991aace7da	e3d7089e-13e3-407c-9504-49c57f7bf44c	896bc99c-7953-4422-a798-5eaac257bd18	Dagha Kabab	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	400.00	400.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:21:46.822	2026-08-03 07:21:46.822
1ae6f7be-60be-4825-885e-b28908511033	e3d7089e-13e3-407c-9504-49c57f7bf44c	8ab60bdf-30d8-4246-a3bc-e1280b400378	Chicken Boti Roll	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	250.00	250.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:22:31.795	2026-08-03 07:22:31.795
23cd8309-703b-4df4-a186-c48c6f2f3994	e3d7089e-13e3-407c-9504-49c57f7bf44c	896bc99c-7953-4422-a798-5eaac257bd18	Chicken Chatni Roll	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	250.00	250.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:22:55.049	2026-08-03 07:22:55.049
bc11da8a-c2bc-4dc3-80c3-2b13bc26f9bb	e3d7089e-13e3-407c-9504-49c57f7bf44c	896bc99c-7953-4422-a798-5eaac257bd18	Malai Boti Roll	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	250.00	250.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:23:12.7	2026-08-03 07:23:12.7
4b8e3899-3ab0-4032-891d-c744ea68ffa5	e3d7089e-13e3-407c-9504-49c57f7bf44c	8ab60bdf-30d8-4246-a3bc-e1280b400378	Chicken Kabab Roll	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	250.00	250.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:23:45.04	2026-08-03 07:23:45.04
569c580f-1406-48f7-8d3e-77a4964fe6d7	e3d7089e-13e3-407c-9504-49c57f7bf44c	8ab60bdf-30d8-4246-a3bc-e1280b400378	Chicken Behari Roll	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	250.00	250.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:24:18.7	2026-08-03 07:24:18.7
abf6fdca-d235-432c-a9dc-0b23290cdb9e	e3d7089e-13e3-407c-9504-49c57f7bf44c	8ab60bdf-30d8-4246-a3bc-e1280b400378	Chicken Kabab Roll	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	250.00	250.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:24:52.281	2026-08-03 07:24:52.281
823a6b36-a041-4d70-9f8d-4f8853e7e86c	e3d7089e-13e3-407c-9504-49c57f7bf44c	8ab60bdf-30d8-4246-a3bc-e1280b400378	Jumbo Roll	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	500.00	500.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:25:20.339	2026-08-03 07:25:20.339
770390f3-f806-4d59-bef6-dd523f556ab5	e3d7089e-13e3-407c-9504-49c57f7bf44c	1bb72993-a5a9-4bc1-a722-86fc6338b023	Fajita	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	299.00	299.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:28:57.758	2026-08-03 07:31:48.833
4e87213d-2842-4565-9a3f-2841179f8079	e3d7089e-13e3-407c-9504-49c57f7bf44c	1bb72993-a5a9-4bc1-a722-86fc6338b023	Tandoori	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	299.00	299.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:29:49.515	2026-08-03 07:31:53.811
ceb1ffe1-ea9c-4133-b8c2-3771db0a8da3	e3d7089e-13e3-407c-9504-49c57f7bf44c	1bb72993-a5a9-4bc1-a722-86fc6338b023	Tikka	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	299.00	299.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:27:57.033	2026-08-03 07:31:42.403
44d4a3e9-4082-4559-bfc6-59813c5ab507	e3d7089e-13e3-407c-9504-49c57f7bf44c	1bb72993-a5a9-4bc1-a722-86fc6338b023	Afghani	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	299.00	299.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:30:49.114	2026-08-03 07:31:59.125
45daebfa-5ebd-4636-a33d-eec16702fa14	e3d7089e-13e3-407c-9504-49c57f7bf44c	1bb72993-a5a9-4bc1-a722-86fc6338b023	Shawarma	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	299.00	299.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:33:11.39	2026-08-03 07:33:11.39
41130e39-e98d-4dd6-b608-29c70123e393	e3d7089e-13e3-407c-9504-49c57f7bf44c	1bb72993-a5a9-4bc1-a722-86fc6338b023	Hot n Spicy	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	299.00	299.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:33:37.287	2026-08-03 07:34:16.486
cefc78ce-27f6-4b14-8320-226148dd81d5	e3d7089e-13e3-407c-9504-49c57f7bf44c	1bb72993-a5a9-4bc1-a722-86fc6338b023	Veggie Lover	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	299.00	299.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:34:40.25	2026-08-03 07:35:10.467
2ca1e875-3d57-483a-9cd4-5d4193fb3f72	e3d7089e-13e3-407c-9504-49c57f7bf44c	1bb72993-a5a9-4bc1-a722-86fc6338b023	Cheesy Lover	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	299.00	299.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:35:26.786	2026-08-03 07:35:52.481
9702d898-8358-4f44-8fec-3b3f32316c3c	e3d7089e-13e3-407c-9504-49c57f7bf44c	19a21d03-68c3-4e39-b144-bba0f41f3f7e	Creamy Tikka	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	399.00	399.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:36:16.965	2026-08-03 07:38:03.322
d10dbf9f-5681-484f-8296-88ebcf4d0ec4	e3d7089e-13e3-407c-9504-49c57f7bf44c	19a21d03-68c3-4e39-b144-bba0f41f3f7e	Fajita Sicilian	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	399.00	399.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:39:58.197	2026-08-03 07:39:58.197
97ee2f89-37f3-4e56-85dd-4a282c89786e	e3d7089e-13e3-407c-9504-49c57f7bf44c	19a21d03-68c3-4e39-b144-bba0f41f3f7e	Malai Boti	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	399.00	399.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:41:01.832	2026-08-03 07:41:01.832
abcab252-83a7-4956-b212-37c39e090bb7	e3d7089e-13e3-407c-9504-49c57f7bf44c	19a21d03-68c3-4e39-b144-bba0f41f3f7e	Pepperoni	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	399.00	399.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:41:59.952	2026-08-03 07:41:59.952
223b02eb-0b7e-4c10-90ba-6611db361160	e3d7089e-13e3-407c-9504-49c57f7bf44c	19a21d03-68c3-4e39-b144-bba0f41f3f7e	Supreme	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	399.00	399.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:42:44.588	2026-08-03 07:42:44.588
3bf03a60-0657-4d59-92ed-514329ba2f95	e3d7089e-13e3-407c-9504-49c57f7bf44c	19a21d03-68c3-4e39-b144-bba0f41f3f7e	Green Shawarma	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	399.00	399.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:43:53.706	2026-08-03 07:43:53.706
a4e464cd-7547-44a2-a4db-70ada1d7eb03	e3d7089e-13e3-407c-9504-49c57f7bf44c	578dc9b4-eacb-4495-a13d-ec80f901355b	Super Supreme	\N	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	499.00	499.00	\N	\N	\N	\N	f	\N	15	t	f	1	2026-08-03 07:45:05.131	2026-08-03 07:45:05.131
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.order_items (id, order_id, menu_item_id, item_name, unit_price, quantity, selected_variants, item_note, total_price, created_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.orders (id, order_number, tenant_id, branch_id, customer_id, channel, fulfillment_type, status, payment_method, payment_status, subtotal, tax_amount, discount_amount, delivery_fee, grand_total, delivery_address, nearest_landmark, delivery_instructions, table_number, special_instructions, private_kitchen_notes, status_timeline, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: platform_plans; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.platform_plans (id, name, monthly_price, max_branches, max_menu_items, transaction_fee_pct, features_json, created_at, updated_at) FROM stdin;
plan-starter	Starter	0.00	1	50	2.50	{"features": ["1 Branch", "50 Menu Items", "POS Terminal", "Online Ordering", "Basic Reports"]}	2026-07-27 10:34:14.892	2026-07-27 10:34:14.892
plan-pro	Pro	4999.00	5	500	1.50	{"features": ["5 Branches", "500 Menu Items", "POS Terminal", "Online Ordering", "Advanced Reports", "Staff Management", "Delivery Zones"]}	2026-07-27 10:34:14.927	2026-07-27 10:34:14.927
\.


--
-- Data for Name: pos_devices; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.pos_devices (id, tenant_id, branch_id, device_id, computer_name, socket_id, version, status, os, local_ip, last_seen, created_at, updated_at) FROM stdin;
feabe27a-22ca-41e1-924f-99250703ff0d	459daa11-c9e6-4baa-89c5-da4b8e29cbd2	a0c8625c-9aaa-4d47-afcd-6d3a4a8ec54b	test-device-001	\N	\N	\N	offline	\N	\N	2026-08-03 10:16:33.107	2026-08-03 05:26:05.692	2026-08-03 10:16:38.65
\.


--
-- Data for Name: print_history; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.print_history (id, tenant_id, branch_id, device_id, printer_id, type, status, payload, error, created_at) FROM stdin;
\.


--
-- Data for Name: print_jobs; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.print_jobs (id, tenant_id, branch_id, device_id, printer_id, type, status, payload, error, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: printers; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.printers (id, tenant_id, branch_id, name, is_receipt, is_kitchen, is_label, driver, vendor_id, product_id, ip, port, paper_width, status, last_heartbeat, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: promotions; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.promotions (id, tenant_id, code, discount_type, discount_value, min_order_amount, max_discount_cap, start_date, end_date, usage_limit, times_used, is_active, created_at, updated_at) FROM stdin;
4a059204-a405-4406-87a3-1560940dbe30	459daa11-c9e6-4baa-89c5-da4b8e29cbd2	PEHLA_ORDER	FREE_DELIVERY	10.00	1000.00	3000.00	2026-08-01 00:00:00	2026-08-02 00:00:00	20	0	t	2026-07-31 07:51:31.966	2026-07-31 08:02:37.406
\.


--
-- Data for Name: staff_profiles; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.staff_profiles (id, user_id, branch_id, designation, permission_orders, permission_menu, permission_reports, permission_settings, created_at, updated_at) FROM stdin;
dc9fee67-42b5-4986-9627-af0a71a08aee	5144ec97-c3ef-4b9b-83c6-2a3ecbb0a7e4	a0c8625c-9aaa-4d47-afcd-6d3a4a8ec54b	OWNER	MANAGE	MANAGE	MANAGE	MANAGE	2026-07-30 15:11:59.314	2026-07-30 15:11:59.314
75ac5885-be0f-4ae1-8234-75e42dbb2750	6ef80f83-a523-4c5e-837c-ad762e4f7576	e2a00869-a3e0-4e5e-b754-899df93350b7	OWNER	MANAGE	MANAGE	MANAGE	MANAGE	2026-08-02 16:21:06.844	2026-08-02 16:21:06.844
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.support_tickets (id, tenant_id, created_by_user_id, subject, category, priority, status, messages_json, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tenant_content; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.tenant_content (id, tenant_id, announcement_text, footer_config, copy_config, hero_slides, faqs, privacy_policy, seo_title, seo_description, active_promo, created_at, updated_at) FROM stdin;
7b405c2c-6f42-48a1-a460-2f6f6ab8d2cf	459daa11-c9e6-4baa-89c5-da4b8e29cbd2	🎉 FREE DELIVERY ON ALL ORDERS ABOVE RS. 3,500.	{"description": "", "layoutVariant": "classic"}	{"twitter": "", "website": "", "facebook": "", "instagram": ""}	[{"image_url": "https://res.cloudinary.com/dvyhnxnpq/image/upload/v1785432313/shopes/marhaba-bar-b-q-restaurant/Banner/j9wea0vpclqr2mfhxjcd.webp", "promo_sub": "", "sort_order": 0, "promo_label": "", "promo_headline": ""}, {"image_url": "https://res.cloudinary.com/dvyhnxnpq/image/upload/v1785432203/shopes/marhaba-bar-b-q-restaurant/Banner/q5jhgzvoij2tpll4yv5g.webp", "promo_sub": "", "sort_order": 1, "promo_label": "", "promo_headline": ""}, {"image_url": "https://res.cloudinary.com/dvyhnxnpq/image/upload/v1785424183/shopes/marhaba-bar-b-q-restaurant/Banner/rhn5m7q4w018bpvkf4oa.webp", "promo_sub": "", "sort_order": 2, "promo_label": "", "promo_headline": ""}]	{"intro": "", "items": [], "title": "FAQs"}	{"intro": "", "title": "Privacy Policy", "sections": [], "lastUpdated": "2026-07-31"}	Marhaba Bar B Q Restaurant	\N	null	2026-07-30 15:11:58.885	2026-08-02 07:35:48.576
eb459208-89d1-44d4-924c-bbd7cf50cec9	e3d7089e-13e3-407c-9504-49c57f7bf44c		\N	{"twitter": "", "website": "", "facebook": "", "instagram": ""}	\N	\N	\N	AZ Food Corner	\N	null	2026-08-02 16:21:06.207	2026-08-02 16:21:06.207
\.


--
-- Data for Name: tenant_settings; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.tenant_settings (id, tenant_id, currency_symbol, currency_code, tax_rate, service_fee, enable_dine_in, enable_takeaway, enable_delivery, enabled_payment_methods, phone, email, address, receipt_header, receipt_footer, stripe_public_key, stripe_secret_key_enc, delivery_fee, min_order_value, created_at, updated_at, delivery_areas, operating_hours) FROM stdin;
64f6b8cf-e9d4-496b-a227-679db2730423	459daa11-c9e6-4baa-89c5-da4b8e29cbd2	Rs.	PKR	0.00	0.00	t	t	t	{CASH,CARD,ONLINE}	0333 3342776	bewithbaacha@gmail.com	4 Abul Hasan Isphahani Rd، near Arshad Ali Sabri Family Park			\N	\N	200.00	0.00	2026-07-30 15:11:58.885	2026-08-02 16:06:29.458	[{"id": "yw17y6dnm", "name": "Gulshan e Iqbal - Block 2 - Imtiaz Shopping mall", "isActive": true, "deliveryFee": 120, "estimatedTime": "45 mins"}, {"id": "l35t6ox8a", "name": "Karachi - DHA - PHASE 2", "isActive": true, "deliveryFee": 150, "estimatedTime": "45 mins"}]	[{"day": "Monday", "isClosed": false, "openTime": "3:00 PM", "closeTime": "11:00 PM"}, {"day": "Tuesday", "isClosed": false, "openTime": "10:00 AM", "closeTime": "11:00 PM"}, {"day": "Wednesday", "isClosed": false, "openTime": "10:00 AM", "closeTime": "11:00 PM"}, {"day": "Thursday", "isClosed": false, "openTime": "10:00 AM", "closeTime": "11:30 PM"}, {"day": "Friday", "isClosed": false, "openTime": "10:00 AM", "closeTime": "12:00 AM"}, {"day": "Saturday", "isClosed": false, "openTime": "10:00 AM", "closeTime": "12:00 AM"}, {"day": "Sunday", "isClosed": false, "openTime": "10:00 AM", "closeTime": "11:00 PM"}]
a6738378-d663-498f-ae79-c43ce4451372	e3d7089e-13e3-407c-9504-49c57f7bf44c	Rs.	PKR	0.00	0.00	t	t	t	{CASH,CARD,ONLINE}	03099930777	\N	, Karachi - DHA - PHASE 2, Karachi - DHA - PHASE 3, Karachi - DHA - PHASE 8, Karachi - Gulshan e Iqbal - Block 13 D, Karachi	\N	\N	\N	\N	150.00	0.00	2026-08-02 16:21:06.207	2026-08-02 16:21:06.207	\N	\N
\.


--
-- Data for Name: tenant_themes; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.tenant_themes (id, tenant_id, primary_color, accent_color, bg_color, logo_url, favicon_url, font_family, default_card_style, popular_card_style, category_background, background_image, background_mode, created_at, updated_at) FROM stdin;
78a96233-5c4f-4e3f-aac0-fedf709db45a	e3d7089e-13e3-407c-9504-49c57f7bf44c	#B51217	#E76B12	#FFF8F0	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1783198029/Logo_wiu5ll.jpg"	\N	Inter	default	default	""	""	color	2026-08-02 16:21:06.207	2026-08-02 16:21:06.207
ad3704d5-15fb-4dc7-81cd-8359577cc2be	459daa11-c9e6-4baa-89c5-da4b8e29cbd2	#410006	#D9B992	#F5F0E8	"https://res.cloudinary.com/dvyhnxnpq/image/upload/v1785423697/shopes/marhaba-bar-b-q-restaurant/Logo/ppi3xbm9z5oceesjaher.webp"	\N	Inter	default	default	""	""	color	2026-07-30 15:11:58.885	2026-08-02 07:35:48.542
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.tenants (id, name, slug, custom_domain, business_type, plan_id, status, created_at, updated_at) FROM stdin;
459daa11-c9e6-4baa-89c5-da4b8e29cbd2	Marhaba Bar B Q Restaurant	marhaba-bar-b-q-restaurant	\N	RESTAURANT	\N	ACTIVE	2026-07-30 15:11:58.885	2026-08-02 07:35:48.26
e3d7089e-13e3-407c-9504-49c57f7bf44c	AZ Food Corner	az-food-corner	\N	RESTAURANT	\N	ACTIVE	2026-08-02 16:21:06.207	2026-08-02 16:21:06.207
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.users (id, tenant_id, email, password_hash, name, avatar_url, global_role, is_active, created_at, updated_at) FROM stdin;
5144ec97-c3ef-4b9b-83c6-2a3ecbb0a7e4	459daa11-c9e6-4baa-89c5-da4b8e29cbd2	marhabaowner@gmail.com	$2a$12$NJVzNMC0aLNvotKwuCrHduIdeJXQupPSitlvCSWi5oLHRodtUBF3e	Khubaib	\N	TENANT_USER	t	2026-07-30 15:11:59.314	2026-08-02 07:35:48.296
7a114948-f88e-43b6-ac3e-d2a45a50953b	\N	syedkhubaibshah@icloud.com	$2a$12$.qo9.CSpyJlChJeYJV8Wd.fgguHD/shOKw2eO2pwHo5SJ0bHibmlS	KS Platform	\N	SUPER_ADMIN	t	2026-07-27 10:34:16.087	2026-08-02 10:36:41.43
6ef80f83-a523-4c5e-837c-ad762e4f7576	e3d7089e-13e3-407c-9504-49c57f7bf44c	aliazharirfan18@gmail.com	$2a$12$ZshOM7quNSxAGFDk1wBBmu8Fe3xvAY/47UVNif5Kr5asi1KAdIVP6	Azhar	\N	TENANT_USER	t	2026-08-02 16:21:06.844	2026-08-02 16:21:06.844
\.


--
-- Data for Name: variant_groups; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.variant_groups (id, menu_item_id, title, min_select, max_select, created_at, updated_at) FROM stdin;
c3016a67-2038-491b-83b3-2a02dd9dc9ae	47437ab1-cc86-4d91-a01c-1a72796adeb1	Size	0	1	2026-07-31 06:29:48.378	2026-07-31 06:29:48.378
ebb6045c-c445-4998-b6d2-4df7ac50ad3d	6a0b1674-4a95-47e8-a86a-09f18ee1ed6a	Size	0	1	2026-08-02 16:49:01.008	2026-08-02 16:49:01.008
95004711-661a-4d4d-ae39-4c9a5786f9db	b63f0ae3-529a-4de4-a4b4-ef3ee4f36719	Plate	0	1	2026-08-02 16:49:14.864	2026-08-02 16:49:14.864
9dee25c4-f8d1-4c6b-bbab-2f7b8f7b11aa	c858f770-2a84-4178-9df8-b5f0f28e9b59	Plate	0	1	2026-08-02 16:51:02.626	2026-08-02 16:51:02.626
99cff476-b08a-433c-b23d-599f0db311e0	ae66a6d5-2413-44c9-aab3-f1985abe9474	Size	0	1	2026-08-03 07:07:29.199	2026-08-03 07:07:29.199
e2389af2-4f52-4450-b50b-a55b4f10f4cb	15615cd1-55a1-4757-b2bf-93c5d7a9a56d	Size 	0	1	2026-08-03 07:08:18.199	2026-08-03 07:08:18.199
a98764a2-7721-4335-b5c0-fed8e3a8d282	1598ca85-5a1f-4a7f-9f1c-f52083dc62f4	Size	0	1	2026-08-03 07:09:32.395	2026-08-03 07:09:32.395
ec5c0a42-0cdf-44be-a9ea-7e5e258cce41	64f30cf7-760c-4847-86e1-b4f02f092a08	Size 	0	1	2026-08-03 07:10:36.96	2026-08-03 07:10:36.96
1959d3ff-0eb1-4081-ad55-b65a3b8201db	921c2901-6ad1-4585-abf0-2403a737edf6	Size	0	1	2026-08-03 07:11:21.785	2026-08-03 07:11:21.785
4a9e88c0-0c00-415a-a93b-51a5742c84b0	15ae24b2-5f4f-47bf-94be-f1ea213dc25c	Size 	0	1	2026-08-03 07:12:00.297	2026-08-03 07:12:00.297
814e9410-0367-47d3-aeb5-78ee9ba0c520	ceb1ffe1-ea9c-4133-b8c2-3771db0a8da3	Size	0	1	2026-08-03 07:31:42.386	2026-08-03 07:31:42.386
b0bff6fa-0a8b-45f8-a7d8-7c383dc5b4e7	770390f3-f806-4d59-bef6-dd523f556ab5	Size 	0	1	2026-08-03 07:31:48.819	2026-08-03 07:31:48.819
5cc0734e-1ab3-4693-bdfc-e2806b712fe3	4e87213d-2842-4565-9a3f-2841179f8079	Size	0	1	2026-08-03 07:31:53.788	2026-08-03 07:31:53.788
3299523f-cfee-4dd5-8245-1d9be3746458	44d4a3e9-4082-4559-bfc6-59813c5ab507	Size	0	1	2026-08-03 07:31:59.11	2026-08-03 07:31:59.11
afa7dae7-a6b6-43d4-8bc5-e8a2b4dc1377	45daebfa-5ebd-4636-a33d-eec16702fa14	Size	0	1	2026-08-03 07:33:11.39	2026-08-03 07:33:11.39
d32d19a8-7ab4-43f6-ad1d-b10655a69c18	41130e39-e98d-4dd6-b608-29c70123e393	Size	0	1	2026-08-03 07:34:16.46	2026-08-03 07:34:16.46
54d65f4b-14f4-4fb2-94b5-7a4bee4966b3	cefc78ce-27f6-4b14-8320-226148dd81d5	Size	0	1	2026-08-03 07:35:10.439	2026-08-03 07:35:10.439
87bcadae-fe90-46da-a9dc-b7f4d8fa9c97	2ca1e875-3d57-483a-9cd4-5d4193fb3f72	Size	0	1	2026-08-03 07:35:52.459	2026-08-03 07:35:52.459
0e2203e3-a383-410c-9546-08bdfea1940b	9702d898-8358-4f44-8fec-3b3f32316c3c	Size	0	1	2026-08-03 07:38:03.299	2026-08-03 07:38:03.299
4bbf55e6-cef9-4cc5-8e4b-77598f059d70	d10dbf9f-5681-484f-8296-88ebcf4d0ec4	Size	0	1	2026-08-03 07:39:58.197	2026-08-03 07:39:58.197
701312af-bfec-4efb-b805-110d80d34b9e	97ee2f89-37f3-4e56-85dd-4a282c89786e	Size	0	1	2026-08-03 07:41:01.832	2026-08-03 07:41:01.832
2d1dae85-edb6-4205-9e2d-cf3e120be542	abcab252-83a7-4956-b212-37c39e090bb7	Size	0	1	2026-08-03 07:41:59.952	2026-08-03 07:41:59.952
c7a45ab1-1add-4c81-980c-7bb0d5bc8031	223b02eb-0b7e-4c10-90ba-6611db361160	Size	0	1	2026-08-03 07:42:44.588	2026-08-03 07:42:44.588
c5ca57d9-a2ba-4404-b31b-d9883d0deda3	3bf03a60-0657-4d59-92ed-514329ba2f95	Size	0	1	2026-08-03 07:43:53.706	2026-08-03 07:43:53.706
de8d13c6-7e58-4363-ad6a-f080d2f48867	a4e464cd-7547-44a2-a4db-70ada1d7eb03	Size	0	1	2026-08-03 07:45:05.131	2026-08-03 07:45:05.131
\.


--
-- Data for Name: variant_options; Type: TABLE DATA; Schema: public; Owner: storeuser
--

COPY public.variant_options (id, variant_group_id, name, price_modifier, is_default, created_at, updated_at) FROM stdin;
6c0dea32-d8a7-4d57-a5ad-52107bfd5a88	c3016a67-2038-491b-83b3-2a02dd9dc9ae	Half Karahi	0.00	f	2026-07-31 06:29:48.378	2026-07-31 06:29:48.378
32eef49e-ef28-4110-aa6d-aa1e81b5b5e3	c3016a67-2038-491b-83b3-2a02dd9dc9ae	Full Karahi	450.00	f	2026-07-31 06:29:48.378	2026-07-31 06:29:48.378
acee5c23-cb65-4986-8c3a-2df008e1893b	ebb6045c-c445-4998-b6d2-4df7ac50ad3d	Half	0.00	f	2026-08-02 16:49:01.008	2026-08-02 16:49:01.008
af1199ef-c8cc-4d06-a316-f2b2a9dbbda7	ebb6045c-c445-4998-b6d2-4df7ac50ad3d	Full	70.00	f	2026-08-02 16:49:01.008	2026-08-02 16:49:01.008
3f47b2d5-a9c1-4539-a5c4-dbbf342fa499	95004711-661a-4d4d-ae39-4c9a5786f9db	Half	0.00	f	2026-08-02 16:49:14.864	2026-08-02 16:49:14.864
68989cbe-2942-4be8-8d72-c300054fdc05	95004711-661a-4d4d-ae39-4c9a5786f9db	Full	170.00	f	2026-08-02 16:49:14.864	2026-08-02 16:49:14.864
17f70623-8cce-48d1-a0a5-6645876fd680	9dee25c4-f8d1-4c6b-bbab-2f7b8f7b11aa	Half	0.00	f	2026-08-02 16:51:02.626	2026-08-02 16:51:02.626
5003da5a-ef2c-4936-9010-e35b7d3215b2	9dee25c4-f8d1-4c6b-bbab-2f7b8f7b11aa	Full	70.00	f	2026-08-02 16:51:02.626	2026-08-02 16:51:02.626
e8f278c6-ab4a-4804-80e0-572863f4bad3	99cff476-b08a-433c-b23d-599f0db311e0	Half	0.00	f	2026-08-03 07:07:29.199	2026-08-03 07:07:29.199
b95ac405-5b3c-4831-8e15-09b39bde76e4	99cff476-b08a-433c-b23d-599f0db311e0	Full	100.00	f	2026-08-03 07:07:29.199	2026-08-03 07:07:29.199
6c1eddd4-1c15-460f-a2ec-52fbb3165714	e2389af2-4f52-4450-b50b-a55b4f10f4cb	Half	0.00	f	2026-08-03 07:08:18.199	2026-08-03 07:08:18.199
e4316aae-d775-4a53-a876-aa735e3d714e	e2389af2-4f52-4450-b50b-a55b4f10f4cb	Full	100.00	f	2026-08-03 07:08:18.199	2026-08-03 07:08:18.199
39306713-2059-4493-a460-dc1fd7f25d6a	a98764a2-7721-4335-b5c0-fed8e3a8d282	Half	0.00	f	2026-08-03 07:09:32.395	2026-08-03 07:09:32.395
23e5b1f2-7e69-4362-b96a-5980b62deb3c	a98764a2-7721-4335-b5c0-fed8e3a8d282	Ful	100.00	f	2026-08-03 07:09:32.395	2026-08-03 07:09:32.395
f3fd175d-f3b6-4bef-8ce9-5bc01ac737bb	ec5c0a42-0cdf-44be-a9ea-7e5e258cce41	Half	0.00	f	2026-08-03 07:10:36.96	2026-08-03 07:10:36.96
4cfc62ff-e761-4968-b30f-e6b5f57d4615	ec5c0a42-0cdf-44be-a9ea-7e5e258cce41	Full	200.00	f	2026-08-03 07:10:36.96	2026-08-03 07:10:36.96
9d5b7d77-64be-44ed-b19d-d2d8b6479dd0	1959d3ff-0eb1-4081-ad55-b65a3b8201db	Half	0.00	f	2026-08-03 07:11:21.785	2026-08-03 07:11:21.785
81db9cba-e25d-4d16-8a5e-5108b90b1ac6	1959d3ff-0eb1-4081-ad55-b65a3b8201db	Full	200.00	f	2026-08-03 07:11:21.785	2026-08-03 07:11:21.785
038dce16-aa75-4e48-85fe-512ea49b3d02	4a9e88c0-0c00-415a-a93b-51a5742c84b0	Half	0.00	f	2026-08-03 07:12:00.297	2026-08-03 07:12:00.297
4626931b-4cf2-41e8-8232-580539f1735a	4a9e88c0-0c00-415a-a93b-51a5742c84b0	Full	100.00	f	2026-08-03 07:12:00.297	2026-08-03 07:12:00.297
6bc50acf-a7e7-4578-9ef4-da6b24e99b7b	814e9410-0367-47d3-aeb5-78ee9ba0c520	Small	0.00	f	2026-08-03 07:31:42.386	2026-08-03 07:31:42.386
79ec1315-d909-45de-b36b-1ad6eef5dc6e	814e9410-0367-47d3-aeb5-78ee9ba0c520	Medium	300.00	f	2026-08-03 07:31:42.386	2026-08-03 07:31:42.386
54a678a0-bfd7-4f28-9f9f-ff9496cfc5fb	814e9410-0367-47d3-aeb5-78ee9ba0c520	Large	500.00	f	2026-08-03 07:31:42.386	2026-08-03 07:31:42.386
2d37f8d0-0dd3-43db-9fe5-ee4e699f633d	b0bff6fa-0a8b-45f8-a7d8-7c383dc5b4e7	Small	0.00	f	2026-08-03 07:31:48.819	2026-08-03 07:31:48.819
7138cbf4-0b02-4408-8fc0-2ce748aa91c0	b0bff6fa-0a8b-45f8-a7d8-7c383dc5b4e7	Medium	300.00	f	2026-08-03 07:31:48.819	2026-08-03 07:31:48.819
5bf85903-b9a6-4cfa-9ea3-bbe5e7494579	b0bff6fa-0a8b-45f8-a7d8-7c383dc5b4e7	Large 	500.00	f	2026-08-03 07:31:48.819	2026-08-03 07:31:48.819
d288617b-1424-4d5f-b2bb-d5ea40a72da6	5cc0734e-1ab3-4693-bdfc-e2806b712fe3	Small	0.00	f	2026-08-03 07:31:53.788	2026-08-03 07:31:53.788
8e27fa86-e88f-48cd-bb0f-43cd8ee38a30	5cc0734e-1ab3-4693-bdfc-e2806b712fe3	Medium	300.00	f	2026-08-03 07:31:53.788	2026-08-03 07:31:53.788
755a17ea-0648-4e25-b1af-21fc9b97ee11	5cc0734e-1ab3-4693-bdfc-e2806b712fe3	Large	500.00	f	2026-08-03 07:31:53.788	2026-08-03 07:31:53.788
e3c65773-5dce-4485-94af-e95b78e061fe	3299523f-cfee-4dd5-8245-1d9be3746458	Small	0.00	f	2026-08-03 07:31:59.11	2026-08-03 07:31:59.11
364b6abd-5b70-42af-9ecc-6af8c081a345	3299523f-cfee-4dd5-8245-1d9be3746458	Medium	300.00	f	2026-08-03 07:31:59.11	2026-08-03 07:31:59.11
37d2b2c2-7199-4dde-a5fb-a26ea6247a43	3299523f-cfee-4dd5-8245-1d9be3746458	Large	500.00	f	2026-08-03 07:31:59.11	2026-08-03 07:31:59.11
91f2897b-6c3b-47a3-a7ad-aef058bba502	afa7dae7-a6b6-43d4-8bc5-e8a2b4dc1377	Small	0.00	f	2026-08-03 07:33:11.39	2026-08-03 07:33:11.39
022cda33-a205-41e3-b4b7-1511ad7258cc	afa7dae7-a6b6-43d4-8bc5-e8a2b4dc1377	Medium	300.00	f	2026-08-03 07:33:11.39	2026-08-03 07:33:11.39
37ed89d4-6c90-4809-8515-b7bd54b59fad	afa7dae7-a6b6-43d4-8bc5-e8a2b4dc1377	Large	500.00	f	2026-08-03 07:33:11.39	2026-08-03 07:33:11.39
249ef826-92b8-423f-95b5-fb716fdd94ed	d32d19a8-7ab4-43f6-ad1d-b10655a69c18	Small	0.00	f	2026-08-03 07:34:16.46	2026-08-03 07:34:16.46
aec16e4d-c4a3-47bf-a7d4-a72785b8d0d9	d32d19a8-7ab4-43f6-ad1d-b10655a69c18	Medium	300.00	f	2026-08-03 07:34:16.46	2026-08-03 07:34:16.46
b784a555-6260-49b0-8cee-0880eae72d09	d32d19a8-7ab4-43f6-ad1d-b10655a69c18	Large	500.00	f	2026-08-03 07:34:16.46	2026-08-03 07:34:16.46
891c24da-331d-4af9-81d9-71028f52f910	54d65f4b-14f4-4fb2-94b5-7a4bee4966b3	Small	0.00	f	2026-08-03 07:35:10.439	2026-08-03 07:35:10.439
90820ef9-b8a7-4705-9407-0ae42b227214	54d65f4b-14f4-4fb2-94b5-7a4bee4966b3	Medium	300.00	f	2026-08-03 07:35:10.439	2026-08-03 07:35:10.439
6dc18200-614f-4b1b-a82a-0fd5fefbc03b	54d65f4b-14f4-4fb2-94b5-7a4bee4966b3	Large	500.00	f	2026-08-03 07:35:10.439	2026-08-03 07:35:10.439
3f36bb3b-f9e4-4d89-b825-d03656f2bdc9	87bcadae-fe90-46da-a9dc-b7f4d8fa9c97	Small	0.00	f	2026-08-03 07:35:52.459	2026-08-03 07:35:52.459
eaa0e7cc-1df8-45d4-b362-dd9e27738abb	87bcadae-fe90-46da-a9dc-b7f4d8fa9c97	Medium	300.00	f	2026-08-03 07:35:52.459	2026-08-03 07:35:52.459
bdbd96dd-c78f-4f10-a86a-d8bc0145774b	87bcadae-fe90-46da-a9dc-b7f4d8fa9c97	Large	500.00	f	2026-08-03 07:35:52.459	2026-08-03 07:35:52.459
f6050abe-6aaf-43d5-a5fd-9a1e2047dc66	0e2203e3-a383-410c-9546-08bdfea1940b	Small	0.00	f	2026-08-03 07:38:03.299	2026-08-03 07:38:03.299
28fe3417-2789-4c10-a423-d3cb0492d1f4	0e2203e3-a383-410c-9546-08bdfea1940b	Medium	400.00	f	2026-08-03 07:38:03.299	2026-08-03 07:38:03.299
db589dc7-9d94-49d5-a7fd-bfeb7e5bb44f	0e2203e3-a383-410c-9546-08bdfea1940b	Large	600.00	f	2026-08-03 07:38:03.299	2026-08-03 07:38:03.299
6d4accb2-57ee-4243-b48e-5ed34d225f7d	4bbf55e6-cef9-4cc5-8e4b-77598f059d70	Small	0.00	f	2026-08-03 07:39:58.197	2026-08-03 07:39:58.197
3b305bd8-a88d-4178-879e-70ecad196bdc	4bbf55e6-cef9-4cc5-8e4b-77598f059d70	Medium	400.00	f	2026-08-03 07:39:58.197	2026-08-03 07:39:58.197
8cf5a07a-ab4b-4c11-9e10-49f75a9665bc	4bbf55e6-cef9-4cc5-8e4b-77598f059d70	Large	600.00	f	2026-08-03 07:39:58.197	2026-08-03 07:39:58.197
ad654f4a-0160-4240-83ff-4343f5eb24bc	701312af-bfec-4efb-b805-110d80d34b9e	Small	0.00	f	2026-08-03 07:41:01.832	2026-08-03 07:41:01.832
b13cf675-40d5-442d-a5e6-9022533123ec	701312af-bfec-4efb-b805-110d80d34b9e	Medium	400.00	f	2026-08-03 07:41:01.832	2026-08-03 07:41:01.832
45082c81-25fc-4218-a1cc-e1ab392c4547	701312af-bfec-4efb-b805-110d80d34b9e	Large	600.00	f	2026-08-03 07:41:01.832	2026-08-03 07:41:01.832
af8dfb00-a11b-45d3-949b-c3a76029071a	2d1dae85-edb6-4205-9e2d-cf3e120be542	Small	0.00	f	2026-08-03 07:41:59.952	2026-08-03 07:41:59.952
f60d6c94-fd6d-4d34-b900-d4499812fff9	2d1dae85-edb6-4205-9e2d-cf3e120be542	Medium	400.00	f	2026-08-03 07:41:59.952	2026-08-03 07:41:59.952
448b56d1-1545-4ee3-b66b-99514898b0f3	2d1dae85-edb6-4205-9e2d-cf3e120be542	Large	600.00	f	2026-08-03 07:41:59.952	2026-08-03 07:41:59.952
56d3fdb7-34e5-4a1b-986e-1287e80933da	c7a45ab1-1add-4c81-980c-7bb0d5bc8031	Small	0.00	f	2026-08-03 07:42:44.588	2026-08-03 07:42:44.588
21287df0-0291-4e5d-85f7-e5d2b22a4dde	c7a45ab1-1add-4c81-980c-7bb0d5bc8031	Medium	400.00	f	2026-08-03 07:42:44.588	2026-08-03 07:42:44.588
d749b04f-be54-4142-a5a0-cb9305a5ca18	c7a45ab1-1add-4c81-980c-7bb0d5bc8031	Large	600.00	f	2026-08-03 07:42:44.588	2026-08-03 07:42:44.588
6be75418-536d-430f-8bc6-3c65e2c17f9b	c5ca57d9-a2ba-4404-b31b-d9883d0deda3	Small	0.00	f	2026-08-03 07:43:53.706	2026-08-03 07:43:53.706
a9f6a8c4-03f2-4af4-be74-0cf878fd6746	c5ca57d9-a2ba-4404-b31b-d9883d0deda3	Medium	400.00	f	2026-08-03 07:43:53.706	2026-08-03 07:43:53.706
932b7272-efb3-4b5a-9e34-2987b956fe73	c5ca57d9-a2ba-4404-b31b-d9883d0deda3	Large	600.00	f	2026-08-03 07:43:53.706	2026-08-03 07:43:53.706
276a9129-6b20-458b-b03f-4ccb33cc94c1	de8d13c6-7e58-4363-ad6a-f080d2f48867	Small	0.00	f	2026-08-03 07:45:05.131	2026-08-03 07:45:05.131
04afa64c-74ed-4b2c-9192-38bee702098a	de8d13c6-7e58-4363-ad6a-f080d2f48867	Medium	300.00	f	2026-08-03 07:45:05.131	2026-08-03 07:45:05.131
52787c30-e37f-4f62-9a22-e3fd8381f735	de8d13c6-7e58-4363-ad6a-f080d2f48867	Large	1000.00	f	2026-08-03 07:45:05.131	2026-08-03 07:45:05.131
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: delivery_zones delivery_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.delivery_zones
    ADD CONSTRAINT delivery_zones_pkey PRIMARY KEY (id);


--
-- Name: global_areas global_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.global_areas
    ADD CONSTRAINT global_areas_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: platform_plans platform_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.platform_plans
    ADD CONSTRAINT platform_plans_pkey PRIMARY KEY (id);


--
-- Name: pos_devices pos_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.pos_devices
    ADD CONSTRAINT pos_devices_pkey PRIMARY KEY (id);


--
-- Name: print_history print_history_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.print_history
    ADD CONSTRAINT print_history_pkey PRIMARY KEY (id);


--
-- Name: print_jobs print_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.print_jobs
    ADD CONSTRAINT print_jobs_pkey PRIMARY KEY (id);


--
-- Name: printers printers_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.printers
    ADD CONSTRAINT printers_pkey PRIMARY KEY (id);


--
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- Name: staff_profiles staff_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.staff_profiles
    ADD CONSTRAINT staff_profiles_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: tenant_content tenant_content_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.tenant_content
    ADD CONSTRAINT tenant_content_pkey PRIMARY KEY (id);


--
-- Name: tenant_settings tenant_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.tenant_settings
    ADD CONSTRAINT tenant_settings_pkey PRIMARY KEY (id);


--
-- Name: tenant_themes tenant_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.tenant_themes
    ADD CONSTRAINT tenant_themes_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: variant_groups variant_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.variant_groups
    ADD CONSTRAINT variant_groups_pkey PRIMARY KEY (id);


--
-- Name: variant_options variant_options_pkey; Type: CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.variant_options
    ADD CONSTRAINT variant_options_pkey PRIMARY KEY (id);


--
-- Name: branches_tenant_id_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX branches_tenant_id_idx ON public.branches USING btree (tenant_id);


--
-- Name: categories_tenant_id_sort_order_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX categories_tenant_id_sort_order_idx ON public.categories USING btree (tenant_id, sort_order);


--
-- Name: customers_tenant_id_phone_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX customers_tenant_id_phone_idx ON public.customers USING btree (tenant_id, phone);


--
-- Name: customers_tenant_id_phone_key; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE UNIQUE INDEX customers_tenant_id_phone_key ON public.customers USING btree (tenant_id, phone);


--
-- Name: delivery_zones_branch_id_is_active_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX delivery_zones_branch_id_is_active_idx ON public.delivery_zones USING btree (branch_id, is_active);


--
-- Name: menu_items_tenant_id_category_id_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX menu_items_tenant_id_category_id_idx ON public.menu_items USING btree (tenant_id, category_id);


--
-- Name: menu_items_tenant_id_is_available_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX menu_items_tenant_id_is_available_idx ON public.menu_items USING btree (tenant_id, is_available);


--
-- Name: order_items_order_id_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX order_items_order_id_idx ON public.order_items USING btree (order_id);


--
-- Name: orders_customer_id_created_at_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX orders_customer_id_created_at_idx ON public.orders USING btree (customer_id, created_at);


--
-- Name: orders_order_number_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX orders_order_number_idx ON public.orders USING btree (order_number);


--
-- Name: orders_order_number_key; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE UNIQUE INDEX orders_order_number_key ON public.orders USING btree (order_number);


--
-- Name: orders_tenant_id_branch_id_status_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX orders_tenant_id_branch_id_status_idx ON public.orders USING btree (tenant_id, branch_id, status);


--
-- Name: pos_devices_branch_id_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX pos_devices_branch_id_idx ON public.pos_devices USING btree (branch_id);


--
-- Name: pos_devices_device_id_key; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE UNIQUE INDEX pos_devices_device_id_key ON public.pos_devices USING btree (device_id);


--
-- Name: pos_devices_tenant_id_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX pos_devices_tenant_id_idx ON public.pos_devices USING btree (tenant_id);


--
-- Name: print_history_branch_id_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX print_history_branch_id_idx ON public.print_history USING btree (branch_id);


--
-- Name: print_history_tenant_id_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX print_history_tenant_id_idx ON public.print_history USING btree (tenant_id);


--
-- Name: print_jobs_branch_id_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX print_jobs_branch_id_idx ON public.print_jobs USING btree (branch_id);


--
-- Name: print_jobs_device_id_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX print_jobs_device_id_idx ON public.print_jobs USING btree (device_id);


--
-- Name: print_jobs_tenant_id_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX print_jobs_tenant_id_idx ON public.print_jobs USING btree (tenant_id);


--
-- Name: printers_branch_id_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX printers_branch_id_idx ON public.printers USING btree (branch_id);


--
-- Name: printers_tenant_id_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX printers_tenant_id_idx ON public.printers USING btree (tenant_id);


--
-- Name: promotions_tenant_id_code_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX promotions_tenant_id_code_idx ON public.promotions USING btree (tenant_id, code);


--
-- Name: staff_profiles_branch_id_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX staff_profiles_branch_id_idx ON public.staff_profiles USING btree (branch_id);


--
-- Name: staff_profiles_user_id_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX staff_profiles_user_id_idx ON public.staff_profiles USING btree (user_id);


--
-- Name: staff_profiles_user_id_key; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE UNIQUE INDEX staff_profiles_user_id_key ON public.staff_profiles USING btree (user_id);


--
-- Name: support_tickets_tenant_id_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX support_tickets_tenant_id_idx ON public.support_tickets USING btree (tenant_id);


--
-- Name: tenant_content_tenant_id_key; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE UNIQUE INDEX tenant_content_tenant_id_key ON public.tenant_content USING btree (tenant_id);


--
-- Name: tenant_settings_tenant_id_key; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE UNIQUE INDEX tenant_settings_tenant_id_key ON public.tenant_settings USING btree (tenant_id);


--
-- Name: tenant_themes_tenant_id_key; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE UNIQUE INDEX tenant_themes_tenant_id_key ON public.tenant_themes USING btree (tenant_id);


--
-- Name: tenants_custom_domain_key; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE UNIQUE INDEX tenants_custom_domain_key ON public.tenants USING btree (custom_domain);


--
-- Name: tenants_slug_key; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE UNIQUE INDEX tenants_slug_key ON public.tenants USING btree (slug);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_tenant_id_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX users_tenant_id_idx ON public.users USING btree (tenant_id);


--
-- Name: variant_groups_menu_item_id_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX variant_groups_menu_item_id_idx ON public.variant_groups USING btree (menu_item_id);


--
-- Name: variant_options_variant_group_id_idx; Type: INDEX; Schema: public; Owner: storeuser
--

CREATE INDEX variant_options_variant_group_id_idx ON public.variant_options USING btree (variant_group_id);


--
-- Name: branches branches_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categories categories_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customers customers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: delivery_zones delivery_zones_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.delivery_zones
    ADD CONSTRAINT delivery_zones_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: menu_items menu_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: menu_items menu_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pos_devices pos_devices_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.pos_devices
    ADD CONSTRAINT pos_devices_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pos_devices pos_devices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.pos_devices
    ADD CONSTRAINT pos_devices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: print_history print_history_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.print_history
    ADD CONSTRAINT print_history_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: print_history print_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.print_history
    ADD CONSTRAINT print_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: print_jobs print_jobs_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.print_jobs
    ADD CONSTRAINT print_jobs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: print_jobs print_jobs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.print_jobs
    ADD CONSTRAINT print_jobs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: printers printers_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.printers
    ADD CONSTRAINT printers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: printers printers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.printers
    ADD CONSTRAINT printers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promotions promotions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff_profiles staff_profiles_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.staff_profiles
    ADD CONSTRAINT staff_profiles_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: staff_profiles staff_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.staff_profiles
    ADD CONSTRAINT staff_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: support_tickets support_tickets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tenant_content tenant_content_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.tenant_content
    ADD CONSTRAINT tenant_content_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tenant_settings tenant_settings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.tenant_settings
    ADD CONSTRAINT tenant_settings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tenant_themes tenant_themes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.tenant_themes
    ADD CONSTRAINT tenant_themes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tenants tenants_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.platform_plans(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: variant_groups variant_groups_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.variant_groups
    ADD CONSTRAINT variant_groups_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: variant_options variant_options_variant_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: storeuser
--

ALTER TABLE ONLY public.variant_options
    ADD CONSTRAINT variant_options_variant_group_id_fkey FOREIGN KEY (variant_group_id) REFERENCES public.variant_groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: storeuser
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict YEWFOfFvnnO4p6OWfm4C4BcC1k50q1KiJXSHKzJ8iftXrnDcoRtRRTPJ4AOR7tu

