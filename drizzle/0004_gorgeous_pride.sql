ALTER TABLE `nodes` ADD `canvasNodeType` varchar(32) DEFAULT 'text';--> statement-breakpoint
ALTER TABLE `nodes` ADD `canvasUrl` text;--> statement-breakpoint
ALTER TABLE `nodes` ADD `canvasLabel` varchar(255);--> statement-breakpoint
ALTER TABLE `nodes` ADD `canvasBackground` text;--> statement-breakpoint
ALTER TABLE `nodes` ADD `canvasBackgroundStyle` varchar(16);--> statement-breakpoint
ALTER TABLE `nodes` ADD `flashcardBack` text;--> statement-breakpoint
ALTER TABLE `nodes` ADD `canvasColor` varchar(16);--> statement-breakpoint
ALTER TABLE `nodes` ADD `canvasZIndex` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `relationships` ADD `edgeColor` varchar(16);--> statement-breakpoint
ALTER TABLE `relationships` ADD `fromSide` varchar(8);--> statement-breakpoint
ALTER TABLE `relationships` ADD `toSide` varchar(8);--> statement-breakpoint
ALTER TABLE `relationships` ADD `fromEnd` varchar(8) DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `relationships` ADD `toEnd` varchar(8) DEFAULT 'arrow';