CREATE TABLE `lifeDomains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`description` text,
	`color` varchar(32) DEFAULT '#6366f1',
	`icon` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lifeDomains_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lifeSkillsGuides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`steps` text,
	`difficulty` varchar(32) DEFAULT 'medium',
	`estimatedTime` int,
	`mediaUrls` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lifeSkillsGuides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nodeMetadata` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nodeId` int NOT NULL,
	`color` varchar(32) DEFAULT '#f3f4f6',
	`lifeDomainId` int,
	`relationshipType` varchar(64),
	`effort` varchar(32),
	`priority` varchar(32) DEFAULT 'medium',
	`limitations` text,
	`supportNeeded` text,
	`customData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nodeMetadata_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskDependencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dependentTaskId` int NOT NULL,
	`dependsOnTaskId` int NOT NULL,
	`type` varchar(32) DEFAULT 'required_before',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskDependencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `nodes` ADD `language` varchar(8) DEFAULT 'en';--> statement-breakpoint
ALTER TABLE `lifeDomains` ADD CONSTRAINT `lifeDomains_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lifeSkillsGuides` ADD CONSTRAINT `lifeSkillsGuides_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lifeSkillsGuides` ADD CONSTRAINT `lifeSkillsGuides_taskId_nodes_id_fk` FOREIGN KEY (`taskId`) REFERENCES `nodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nodeMetadata` ADD CONSTRAINT `nodeMetadata_nodeId_nodes_id_fk` FOREIGN KEY (`nodeId`) REFERENCES `nodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nodeMetadata` ADD CONSTRAINT `nodeMetadata_lifeDomainId_lifeDomains_id_fk` FOREIGN KEY (`lifeDomainId`) REFERENCES `lifeDomains`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskDependencies` ADD CONSTRAINT `taskDependencies_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskDependencies` ADD CONSTRAINT `taskDependencies_dependentTaskId_nodes_id_fk` FOREIGN KEY (`dependentTaskId`) REFERENCES `nodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskDependencies` ADD CONSTRAINT `taskDependencies_dependsOnTaskId_nodes_id_fk` FOREIGN KEY (`dependsOnTaskId`) REFERENCES `nodes`(`id`) ON DELETE cascade ON UPDATE no action;