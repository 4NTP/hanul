-- Create table for SubAgentUpdateHistory
CREATE TABLE IF NOT EXISTS "public"."SubAgentUpdateHistory" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "subAgentId" uuid NOT NULL,
  "oldPrompt" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

-- FK with ON DELETE CASCADE so history rows are removed when SubAgent is deleted
ALTER TABLE "public"."SubAgentUpdateHistory"
  ADD CONSTRAINT "SubAgentUpdateHistory_subAgentId_fkey"
  FOREIGN KEY ("subAgentId") REFERENCES "public"."SubAgent"("id") ON DELETE CASCADE;

-- Index for faster lookups by subAgentId and createdAt ordering
CREATE INDEX IF NOT EXISTS "SubAgentUpdateHistory_subAgentId_createdAt_idx"
  ON "public"."SubAgentUpdateHistory" ("subAgentId", "createdAt");

-- Trigger function to capture prompt changes on update
CREATE OR REPLACE FUNCTION public.fn_log_subagent_prompt_update()
RETURNS trigger AS $$
BEGIN
  IF NEW."prompt" IS DISTINCT FROM OLD."prompt" THEN
    INSERT INTO public."SubAgentUpdateHistory" ("subAgentId", "oldPrompt")
    VALUES (OLD."id", OLD."prompt");
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on SubAgent updates
DROP TRIGGER IF EXISTS trg_log_subagent_prompt_update ON public."SubAgent";
CREATE TRIGGER trg_log_subagent_prompt_update
AFTER UPDATE ON public."SubAgent"
FOR EACH ROW
EXECUTE FUNCTION public.fn_log_subagent_prompt_update();


