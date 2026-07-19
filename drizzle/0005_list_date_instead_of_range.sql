-- Rename start_date → date and drop end_date
ALTER TABLE "shopping_list" RENAME COLUMN "start_date" TO "date";
ALTER TABLE "shopping_list" DROP COLUMN "end_date";
