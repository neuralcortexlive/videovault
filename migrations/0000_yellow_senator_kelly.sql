CREATE TABLE "api_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"youtube_api_key" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "batch_download_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer NOT NULL,
	"video_id" text NOT NULL,
	"title" text NOT NULL,
	"download_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"order" integer DEFAULT 0,
	"error" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "batch_downloads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_videos" integer DEFAULT 0,
	"completed_videos" integer DEFAULT 0,
	"failed_videos" integer DEFAULT 0,
	"quality_preset_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "downloads" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0,
	"total_size" integer,
	"downloaded_size" integer,
	"error" text,
	"format" text,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "quality_presets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"format" text,
	"video_quality" text,
	"audio_quality" text,
	"audio_only" boolean DEFAULT false,
	"video_only" boolean DEFAULT false,
	"extract_subtitles" boolean DEFAULT false,
	"additional_flags" jsonb,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "video_collections" (
	"video_id" integer NOT NULL,
	"collection_id" integer NOT NULL,
	"added_at" timestamp DEFAULT now(),
	CONSTRAINT "video_collections_video_id_collection_id_pk" PRIMARY KEY("video_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"title" text NOT NULL,
	"channel_title" text NOT NULL,
	"description" text,
	"thumbnail" text,
	"duration" text,
	"published_at" timestamp,
	"view_count" integer,
	"like_count" integer,
	"filepath" text,
	"filesize" integer,
	"quality" text,
	"format" text,
	"downloaded" boolean DEFAULT false,
	"downloaded_at" timestamp,
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "videos_video_id_unique" UNIQUE("video_id")
);
--> statement-breakpoint
ALTER TABLE "batch_download_items" ADD CONSTRAINT "batch_download_items_batch_id_batch_downloads_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch_downloads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_download_items" ADD CONSTRAINT "batch_download_items_download_id_downloads_id_fk" FOREIGN KEY ("download_id") REFERENCES "public"."downloads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_downloads" ADD CONSTRAINT "batch_downloads_quality_preset_id_quality_presets_id_fk" FOREIGN KEY ("quality_preset_id") REFERENCES "public"."quality_presets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_collections" ADD CONSTRAINT "video_collections_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_collections" ADD CONSTRAINT "video_collections_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;