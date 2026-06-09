CREATE TABLE `nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(32) NOT NULL DEFAULT 'note',
	`body` text,
	`properties` text,
	`tags` text,
	`status` varchar(32) DEFAULT 'inbox',
	`startTime` varchar(64),
	`endTime` varchar(64),
	`canvasX` int DEFAULT 0,
	`canvasY` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fromNodeId` int NOT NULL,
	`toNodeId` int NOT NULL,
	`type` varchar(64) NOT NULL DEFAULT 'related_to',
	`label` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `relationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suggestedRelationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fromNodeId` int NOT NULL,
	`toNodeId` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`label` varchar(255),
	`confidence` int NOT NULL DEFAULT 0,
	`reason` text,
	`status` varchar(32) DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `suggestedRelationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `nodes` ADD CONSTRAINT `nodes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `relationships` ADD CONSTRAINT `relationships_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `relationships` ADD CONSTRAINT `relationships_fromNodeId_nodes_id_fk` FOREIGN KEY (`fromNodeId`) REFERENCES `nodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `relationships` ADD CONSTRAINT `relationships_toNodeId_nodes_id_fk` FOREIGN KEY (`toNodeId`) REFERENCES `nodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suggestedRelationships` ADD CONSTRAINT `suggestedRelationships_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suggestedRelationships` ADD CONSTRAINT `suggestedRelationships_fromNodeId_nodes_id_fk` FOREIGN KEY (`fromNodeId`) REFERENCES `nodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suggestedRelationships` ADD CONSTRAINT `suggestedRelationships_toNodeId_nodes_id_fk` FOREIGN KEY (`toNodeId`) REFERENCES `nodes`(`id`) ON DELETE cascade ON UPDATE no action;