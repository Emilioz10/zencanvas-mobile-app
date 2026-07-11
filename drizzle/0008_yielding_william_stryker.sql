CREATE TABLE `entities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entityType` varchar(64) NOT NULL DEFAULT 'concept',
	`name` varchar(255) NOT NULL,
	`icon` varchar(8) DEFAULT '📌',
	`color` varchar(16) DEFAULT '#6366f1',
	`body` text,
	`properties` text,
	`status` varchar(32) DEFAULT 'active',
	`tags` text,
	`domain` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `entities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `entityLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fromEntityId` int NOT NULL,
	`toEntityId` int NOT NULL,
	`linkType` varchar(64) NOT NULL DEFAULT 'related',
	`label` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entityLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `entities` ADD CONSTRAINT `entities_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `entityLinks` ADD CONSTRAINT `entityLinks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `entityLinks` ADD CONSTRAINT `entityLinks_fromEntityId_entities_id_fk` FOREIGN KEY (`fromEntityId`) REFERENCES `entities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `entityLinks` ADD CONSTRAINT `entityLinks_toEntityId_entities_id_fk` FOREIGN KEY (`toEntityId`) REFERENCES `entities`(`id`) ON DELETE cascade ON UPDATE no action;