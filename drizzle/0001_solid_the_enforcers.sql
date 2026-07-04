CREATE TABLE "weekly_report_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"last_error" text,
	"resend_email_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "weekly_report_deliveries_user_id_idx" ON "weekly_report_deliveries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "weekly_report_deliveries_status_idx" ON "weekly_report_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "weekly_report_deliveries_period_start_idx" ON "weekly_report_deliveries" USING btree ("period_start");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_report_deliveries_user_period_uidx" ON "weekly_report_deliveries" USING btree ("user_id","period_start","period_end");