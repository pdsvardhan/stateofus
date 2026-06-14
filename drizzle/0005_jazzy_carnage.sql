ALTER TABLE `questions` ADD `hint` text;--> statement-breakpoint
UPDATE `questions` SET `hint` = CASE `mode`
  WHEN 'quick_pick' THEN 'one tap, no overthinking'
  WHEN 'tradeoff_cards' THEN 'you must pick one'
  WHEN 'swipe_stack' THEN 'verdict per card'
  WHEN 'bucket_sort' THEN 'sort every one, one screen'
  WHEN 'tier_placement' THEN 'every item, one screen'
  WHEN 'rank_order' THEN 'put them in your strict order'
  WHEN 'podium_slots' THEN 'tap into your top three'
  WHEN 'logo_quick_pick' THEN 'tap the badge you trust'
  ELSE 'one tap, no overthinking'
END WHERE `hint` IS NULL;
