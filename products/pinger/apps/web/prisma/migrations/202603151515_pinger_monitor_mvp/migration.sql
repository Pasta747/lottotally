-- Add expected status code and switch default interval to 1 minute for MVP
ALTER TABLE "Monitor"
ADD COLUMN IF NOT EXISTS "expectedStatusCode" INTEGER NOT NULL DEFAULT 200;

ALTER TABLE "Monitor"
ALTER COLUMN "interval" SET DEFAULT 'ONE_MINUTE';
