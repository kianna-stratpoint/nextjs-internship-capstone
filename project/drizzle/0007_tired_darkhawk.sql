ALTER TABLE "projects" ALTER COLUMN "priority" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "priority" DROP NOT NULL;