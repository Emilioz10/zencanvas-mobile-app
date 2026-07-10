CREATE TABLE `dailyLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`topic` varchar(32) NOT NULL,
	`eventType` varchar(64) NOT NULL DEFAULT 'note',
	`value` varchar(64),
	`unit` varchar(16),
	`notes` text,
	`eventAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailyLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dailyLogs` ADD CONSTRAINT `dailyLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;