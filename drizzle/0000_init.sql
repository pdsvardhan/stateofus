CREATE TABLE `answers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` text NOT NULL,
	`device_id` integer NOT NULL,
	`payload_json` text NOT NULL,
	`region_state` text,
	`region_city` text,
	`answered_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_answers_question_device` ON `answers` (`question_id`,`device_id`);--> statement-breakpoint
CREATE INDEX `idx_answers_question` ON `answers` (`question_id`);--> statement-breakpoint
CREATE TABLE `app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`device_hash` text NOT NULL,
	`first_seen_at` text DEFAULT (datetime('now')) NOT NULL,
	`last_seen_at` text DEFAULT (datetime('now')) NOT NULL,
	`region_city` text,
	`region_state` text,
	`region_source` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_devices_hash` ON `devices` (`device_hash`);--> statement-breakpoint
CREATE TABLE `lifecycle_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` text NOT NULL,
	`from_status` text NOT NULL,
	`to_status` text NOT NULL,
	`actor` text NOT NULL,
	`reason` text,
	`at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_lifecycle_question` ON `lifecycle_events` (`question_id`);--> statement-breakpoint
CREATE TABLE `question_aggregates` (
	`question_id` text NOT NULL,
	`dim` text DEFAULT 'overall' NOT NULL,
	`dim_key` text DEFAULT '' NOT NULL,
	`agg_json` text NOT NULL,
	`sample_n` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	PRIMARY KEY(`question_id`, `dim`, `dim_key`),
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `question_options` (
	`question_id` text NOT NULL,
	`idx` integer NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`sublabel` text,
	PRIMARY KEY(`question_id`, `idx`),
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`subcategory` text,
	`title` text,
	`text` text NOT NULL,
	`objective` text,
	`mode` text NOT NULL,
	`interaction_description` text,
	`answer_structure` text,
	`options_json` text DEFAULT '[]' NOT NULL,
	`targets_json` text,
	`skip_allowed` integer DEFAULT 1 NOT NULL,
	`primary_dv` text NOT NULL,
	`secondary_dvs_json` text DEFAULT '[]' NOT NULL,
	`dv_raw` text,
	`insight_type` text,
	`expected_result_shape` text,
	`expected_emotion` text,
	`score_participation` integer,
	`score_interestingness` integer,
	`score_ease` integer,
	`score_discussion` integer,
	`score_shareability` integer,
	`experience_requirement` text,
	`bias_risk` text,
	`why_exists` text,
	`what_interesting` text,
	`alternative_versions` text,
	`rejected_alternatives` text,
	`mvp_priority` text,
	`notes` text,
	`geo` integer DEFAULT 0 NOT NULL,
	`source` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`approved_by` text,
	`approved_at` text,
	`import_warnings_json` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_questions_status` ON `questions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_questions_category` ON `questions` (`category`,`status`);--> statement-breakpoint
CREATE TABLE `rate_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scope` text NOT NULL,
	`scope_key` text NOT NULL,
	`kind` text NOT NULL,
	`detail` text,
	`at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rate_events_scope` ON `rate_events` (`scope_key`,`at`);--> statement-breakpoint
CREATE TABLE `reactions` (
	`question_id` text NOT NULL,
	`device_id` integer NOT NULL,
	`kind` text NOT NULL,
	`reacted_at` text DEFAULT (datetime('now')) NOT NULL,
	PRIMARY KEY(`question_id`, `device_id`),
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action
);
