ALTER TABLE `questions` ADD `swipe_yes_label` text;--> statement-breakpoint
ALTER TABLE `questions` ADD `swipe_no_label` text;--> statement-breakpoint
UPDATE `questions` SET `swipe_yes_label` = 'Acceptable', `swipe_no_label` = 'Crime' WHERE `id` = 'Q-103';--> statement-breakpoint
UPDATE `questions` SET `swipe_yes_label` = 'Keep', `swipe_no_label` = 'Skip' WHERE `id` = 'Q-602';--> statement-breakpoint
UPDATE `questions` SET `swipe_yes_label` = 'Rewatch', `swipe_no_label` = 'Pass' WHERE `id` = 'NEW-216';--> statement-breakpoint
UPDATE `questions` SET `swipe_yes_label` = 'Perfectly fine', `swipe_no_label` = 'A crime' WHERE `id` = 'C1-33';--> statement-breakpoint
UPDATE `questions` SET `swipe_yes_label` = 'Fine', `swipe_no_label` = 'Not fine' WHERE `id` = 'C5-27';--> statement-breakpoint
UPDATE `questions` SET `swipe_yes_label` = 'Essential', `swipe_no_label` = 'Marketing' WHERE `id` = 'C2-33';--> statement-breakpoint
UPDATE `questions` SET `swipe_yes_label` = 'Would', `swipe_no_label` = 'Never' WHERE `id` = 'C6-26';--> statement-breakpoint
UPDATE `questions` SET `swipe_yes_label` = 'Worth it', `swipe_no_label` = 'Overrated' WHERE `id` = 'C4-27';--> statement-breakpoint
UPDATE `questions` SET `swipe_yes_label` = 'Better at home', `swipe_no_label` = 'At the office' WHERE `id` = 'Q-205';
