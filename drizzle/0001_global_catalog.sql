CREATE TABLE "province" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "city" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"province_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_item" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"global_category_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_price" (
	"id" text PRIMARY KEY NOT NULL,
	"global_item_id" text NOT NULL,
	"city_id" text NOT NULL,
	"price" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "city" ADD CONSTRAINT "city_province_id_province_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."province"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "city_province_id_idx" ON "city" USING btree ("province_id");--> statement-breakpoint
ALTER TABLE "global_item" ADD CONSTRAINT "global_item_global_category_id_global_category_id_fk" FOREIGN KEY ("global_category_id") REFERENCES "public"."global_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "global_item_category_id_idx" ON "global_item" USING btree ("global_category_id");--> statement-breakpoint
ALTER TABLE "global_price" ADD CONSTRAINT "global_price_global_item_id_global_item_id_fk" FOREIGN KEY ("global_item_id") REFERENCES "public"."global_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_price" ADD CONSTRAINT "global_price_city_id_city_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."city"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "global_price_item_id_idx" ON "global_price" USING btree ("global_item_id");--> statement-breakpoint
CREATE INDEX "global_price_city_id_idx" ON "global_price" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "global_price_item_city_idx" ON "global_price" USING btree ("global_item_id","city_id");--> statement-breakpoint
ALTER TABLE "global_price" ADD CONSTRAINT "global_price_non_negative" CHECK ("global_price"."price" >= 0);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "province_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "city_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_province_id_province_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."province"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_city_id_city_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."city"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "global_category_id" text;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_global_category_id_global_category_id_fk" FOREIGN KEY ("global_category_id") REFERENCES "public"."global_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_global_category_id_idx" ON "category" USING btree ("global_category_id");--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "global_item_id" text;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_global_item_id_global_item_id_fk" FOREIGN KEY ("global_item_id") REFERENCES "public"."global_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "item_global_item_id_idx" ON "item" USING btree ("global_item_id");
