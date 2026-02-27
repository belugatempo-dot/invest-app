CREATE TABLE `decisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ticker` text NOT NULL,
	`action` text NOT NULL,
	`signal_total` integer,
	`rating` text,
	`price_at_decision` real,
	`entry` text,
	`target` text,
	`stop` text,
	`thesis_zh` text,
	`decided_at` text DEFAULT (datetime('now')),
	`outcome_price` real,
	`outcome_date` text,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `screen_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`theme_id` text NOT NULL,
	`source` text NOT NULL,
	`run_at` text DEFAULT (datetime('now')) NOT NULL,
	`candidate_count` integer,
	FOREIGN KEY (`theme_id`) REFERENCES `themes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stock_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`run_id` integer NOT NULL,
	`ticker` text NOT NULL,
	`company` text NOT NULL,
	`exchange` text,
	`close` real,
	`change_pct` real,
	`market_cap` real,
	`pe` real,
	`ev_ebitda` real,
	`rev_growth` real,
	`gross_margin` real,
	`op_margin` real,
	`fcf_margin` real,
	`rsi` real,
	`adx` real,
	`sma50` real,
	`sma200` real,
	`high_52w` real,
	`low_52w` real,
	`ath` real,
	`earnings_date` text,
	`earnings_days` integer,
	`sig_valuation` integer,
	`sig_growth` integer,
	`sig_margins` integer,
	`sig_trend` integer,
	`sig_momentum` integer,
	`sig_pattern` integer,
	`sig_catalyst` integer,
	`signal_total` integer,
	`rating` text,
	`entry_range` text,
	`target` text,
	`stop` text,
	`thesis_zh` text,
	`thesis_en` text,
	`chart_daily` text,
	`chart_weekly` text,
	`sector` text,
	FOREIGN KEY (`run_id`) REFERENCES `screen_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stock_snapshots_run_ticker_idx` ON `stock_snapshots` (`run_id`,`ticker`);--> statement-breakpoint
CREATE TABLE `themes` (
	`id` text PRIMARY KEY NOT NULL,
	`name_zh` text NOT NULL,
	`name_en` text NOT NULL,
	`sectors` text NOT NULL,
	`filters` text NOT NULL,
	`schedule` text
);
--> statement-breakpoint
CREATE TABLE `watchlist` (
	`ticker` text PRIMARY KEY NOT NULL,
	`added_at` text DEFAULT (datetime('now')),
	`notes_zh` text,
	`cost_basis` real,
	`shares` real
);
