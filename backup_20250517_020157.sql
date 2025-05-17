--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.5 (Homebrew)

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
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: api_config; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.api_config (
    id integer NOT NULL,
    youtube_api_key text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.api_config OWNER TO neondb_owner;

--
-- Name: api_config_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.api_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.api_config_id_seq OWNER TO neondb_owner;

--
-- Name: api_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.api_config_id_seq OWNED BY public.api_config.id;


--
-- Name: api_configs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.api_configs (
    id integer NOT NULL,
    youtube_api_key text,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.api_configs OWNER TO neondb_owner;

--
-- Name: api_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.api_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.api_configs_id_seq OWNER TO neondb_owner;

--
-- Name: api_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.api_configs_id_seq OWNED BY public.api_configs.id;


--
-- Name: batch_download_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.batch_download_items (
    id integer NOT NULL,
    batch_id integer NOT NULL,
    video_id text NOT NULL,
    title text NOT NULL,
    download_id integer,
    status text DEFAULT 'pending'::text NOT NULL,
    "order" integer DEFAULT 0,
    error text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.batch_download_items OWNER TO neondb_owner;

--
-- Name: batch_download_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.batch_download_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.batch_download_items_id_seq OWNER TO neondb_owner;

--
-- Name: batch_download_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.batch_download_items_id_seq OWNED BY public.batch_download_items.id;


--
-- Name: batch_downloads; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.batch_downloads (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'pending'::text NOT NULL,
    total_videos integer DEFAULT 0,
    completed_videos integer DEFAULT 0,
    failed_videos integer DEFAULT 0,
    quality_preset_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp with time zone
);


ALTER TABLE public.batch_downloads OWNER TO neondb_owner;

--
-- Name: batch_downloads_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.batch_downloads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.batch_downloads_id_seq OWNER TO neondb_owner;

--
-- Name: batch_downloads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.batch_downloads_id_seq OWNED BY public.batch_downloads.id;


--
-- Name: collections; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.collections (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.collections OWNER TO neondb_owner;

--
-- Name: collections_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.collections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.collections_id_seq OWNER TO neondb_owner;

--
-- Name: collections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.collections_id_seq OWNED BY public.collections.id;


--
-- Name: downloads; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.downloads (
    id integer NOT NULL,
    video_id text NOT NULL,
    title text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    progress integer DEFAULT 0,
    total_size double precision,
    downloaded_size double precision,
    error text,
    format text,
    started_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp with time zone
);


ALTER TABLE public.downloads OWNER TO neondb_owner;

--
-- Name: downloads_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.downloads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.downloads_id_seq OWNER TO neondb_owner;

--
-- Name: downloads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.downloads_id_seq OWNED BY public.downloads.id;


--
-- Name: quality_presets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.quality_presets (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    format text,
    video_quality text,
    audio_quality text,
    audio_only boolean DEFAULT false,
    video_only boolean DEFAULT false,
    extract_subtitles boolean DEFAULT false,
    additional_flags jsonb,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.quality_presets OWNER TO neondb_owner;

--
-- Name: quality_presets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.quality_presets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quality_presets_id_seq OWNER TO neondb_owner;

--
-- Name: quality_presets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.quality_presets_id_seq OWNED BY public.quality_presets.id;


--
-- Name: video_collections; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.video_collections (
    video_id text NOT NULL,
    collection_id integer NOT NULL,
    added_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.video_collections OWNER TO neondb_owner;

--
-- Name: videos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.videos (
    id integer NOT NULL,
    video_id text NOT NULL,
    title text NOT NULL,
    channel_title text NOT NULL,
    description text,
    thumbnail text,
    duration text,
    published_at timestamp with time zone,
    view_count integer,
    like_count integer,
    comment_count integer,
    downloaded boolean DEFAULT false NOT NULL,
    in_collection boolean DEFAULT false NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    filepath text,
    filesize integer
);


ALTER TABLE public.videos OWNER TO neondb_owner;

--
-- Name: videos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.videos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.videos_id_seq OWNER TO neondb_owner;

--
-- Name: videos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.videos_id_seq OWNED BY public.videos.id;


--
-- Name: api_config id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_config ALTER COLUMN id SET DEFAULT nextval('public.api_config_id_seq'::regclass);


--
-- Name: api_configs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_configs ALTER COLUMN id SET DEFAULT nextval('public.api_configs_id_seq'::regclass);


--
-- Name: batch_download_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.batch_download_items ALTER COLUMN id SET DEFAULT nextval('public.batch_download_items_id_seq'::regclass);


--
-- Name: batch_downloads id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.batch_downloads ALTER COLUMN id SET DEFAULT nextval('public.batch_downloads_id_seq'::regclass);


--
-- Name: collections id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.collections ALTER COLUMN id SET DEFAULT nextval('public.collections_id_seq'::regclass);


--
-- Name: downloads id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.downloads ALTER COLUMN id SET DEFAULT nextval('public.downloads_id_seq'::regclass);


--
-- Name: quality_presets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quality_presets ALTER COLUMN id SET DEFAULT nextval('public.quality_presets_id_seq'::regclass);


--
-- Name: videos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.videos ALTER COLUMN id SET DEFAULT nextval('public.videos_id_seq'::regclass);


--
-- Data for Name: api_config; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.api_config (id, youtube_api_key, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: api_configs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.api_configs (id, youtube_api_key, updated_at) FROM stdin;
\.


--
-- Data for Name: batch_download_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.batch_download_items (id, batch_id, video_id, title, download_id, status, "order", error, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: batch_downloads; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.batch_downloads (id, name, description, status, total_videos, completed_videos, failed_videos, quality_preset_id, created_at, updated_at, completed_at) FROM stdin;
\.


--
-- Data for Name: collections; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.collections (id, name, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: downloads; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.downloads (id, video_id, title, status, progress, total_size, downloaded_size, error, format, started_at, completed_at) FROM stdin;
\.


--
-- Data for Name: quality_presets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.quality_presets (id, name, description, format, video_quality, audio_quality, audio_only, video_only, extract_subtitles, additional_flags, is_default, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: video_collections; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.video_collections (video_id, collection_id, added_at) FROM stdin;
\.


--
-- Data for Name: videos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.videos (id, video_id, title, channel_title, description, thumbnail, duration, published_at, view_count, like_count, comment_count, downloaded, in_collection, deleted, deleted_at, created_at, updated_at, filepath, filesize) FROM stdin;
\.


--
-- Name: api_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.api_config_id_seq', 1, false);


--
-- Name: api_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.api_configs_id_seq', 1, false);


--
-- Name: batch_download_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.batch_download_items_id_seq', 1, false);


--
-- Name: batch_downloads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.batch_downloads_id_seq', 1, false);


--
-- Name: collections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.collections_id_seq', 7, true);


--
-- Name: downloads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.downloads_id_seq', 6, true);


--
-- Name: quality_presets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.quality_presets_id_seq', 1, false);


--
-- Name: videos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.videos_id_seq', 6, true);


--
-- Name: api_config api_config_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_config
    ADD CONSTRAINT api_config_pkey PRIMARY KEY (id);


--
-- Name: api_configs api_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_configs
    ADD CONSTRAINT api_configs_pkey PRIMARY KEY (id);


--
-- Name: batch_download_items batch_download_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.batch_download_items
    ADD CONSTRAINT batch_download_items_pkey PRIMARY KEY (id);


--
-- Name: batch_downloads batch_downloads_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.batch_downloads
    ADD CONSTRAINT batch_downloads_pkey PRIMARY KEY (id);


--
-- Name: collections collections_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_pkey PRIMARY KEY (id);


--
-- Name: downloads downloads_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.downloads
    ADD CONSTRAINT downloads_pkey PRIMARY KEY (id);


--
-- Name: quality_presets quality_presets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quality_presets
    ADD CONSTRAINT quality_presets_pkey PRIMARY KEY (id);


--
-- Name: video_collections video_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.video_collections
    ADD CONSTRAINT video_collections_pkey PRIMARY KEY (video_id, collection_id);


--
-- Name: videos videos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_pkey PRIMARY KEY (id);


--
-- Name: videos videos_video_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_video_id_key UNIQUE (video_id);


--
-- Name: api_config update_api_config_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER update_api_config_updated_at BEFORE UPDATE ON public.api_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: batch_download_items batch_download_items_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.batch_download_items
    ADD CONSTRAINT batch_download_items_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batch_downloads(id) ON DELETE CASCADE;


--
-- Name: batch_download_items batch_download_items_download_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.batch_download_items
    ADD CONSTRAINT batch_download_items_download_id_fkey FOREIGN KEY (download_id) REFERENCES public.downloads(id);


--
-- Name: batch_downloads batch_downloads_quality_preset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.batch_downloads
    ADD CONSTRAINT batch_downloads_quality_preset_id_fkey FOREIGN KEY (quality_preset_id) REFERENCES public.quality_presets(id);


--
-- Name: video_collections video_collections_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.video_collections
    ADD CONSTRAINT video_collections_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(id) ON DELETE CASCADE;


--
-- Name: video_collections video_collections_video_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.video_collections
    ADD CONSTRAINT video_collections_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(video_id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

