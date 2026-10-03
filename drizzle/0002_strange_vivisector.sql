CREATE TABLE "category_learnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword" text NOT NULL,
	"kategori" text NOT NULL,
	"sub_kategori" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "category_learnings_keyword_unique" UNIQUE("keyword")
);
