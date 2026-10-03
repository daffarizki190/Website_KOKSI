CREATE TABLE "settings" (
	"setting_key" text PRIMARY KEY NOT NULL,
	"setting_value" text NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_blocked" boolean DEFAULT false;