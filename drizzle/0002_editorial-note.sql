ALTER TABLE `questions` ADD `editorial_note` text;--> statement-breakpoint
UPDATE `questions` SET `editorial_note` = 'Metro residents pick public transport nearly twice as often as people in smaller cities.' WHERE `id` = 'Q-101';--> statement-breakpoint
UPDATE `questions` SET `editorial_note` = 'Aloo tikki polls higher in the north — the fry belt runs south.' WHERE `id` = 'Q-605';--> statement-breakpoint
UPDATE `questions` SET `editorial_note` = 'Notifications top the list for under-30s — beating the commute itself.' WHERE `id` = 'Q-201';--> statement-breakpoint
UPDATE `questions` SET `editorial_note` = 'Barely anyone still hunts for new music themselves — and most who do are over 40.' WHERE `id` = 'Q-305';--> statement-breakpoint
UPDATE `questions` SET `editorial_note` = 'Vada pav and pani puri trade the crown city by city — samosa just never leaves the podium.' WHERE `id` = 'NEW-92';--> statement-breakpoint
UPDATE `questions` SET `editorial_note` = 'Filter coffee owns the south; chai takes the rest — the one cup the country will not agree on.' WHERE `id` = 'NEW-93';
