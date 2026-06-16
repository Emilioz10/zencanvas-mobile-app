ALTER TABLE `nodes` ADD `canvasWidth` int DEFAULT 220;--> statement-breakpoint
ALTER TABLE `nodes` ADD `canvasHeight` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `nodes` ADD `cardColor` varchar(16);--> statement-breakpoint
ALTER TABLE `nodes` ADD `attachmentUrl` text;--> statement-breakpoint
ALTER TABLE `nodes` ADD `attachmentType` varchar(32);--> statement-breakpoint
ALTER TABLE `nodes` ADD `attachmentName` varchar(255);