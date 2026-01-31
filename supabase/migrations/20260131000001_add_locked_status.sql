-- Add 'locked' status to chapters table
ALTER TABLE public.chapters 
DROP CONSTRAINT IF EXISTS chapters_status_check;

ALTER TABLE public.chapters 
ADD CONSTRAINT chapters_status_check 
CHECK (status IN ('pending', 'generating', 'completed', 'failed', 'locked', 'editing'));
