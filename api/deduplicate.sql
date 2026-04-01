-- 1. Deduplicate Quizzes
-- This deletes all but the first (oldest) entry for each unique question within a category
DELETE FROM public.quizzes
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY category_id, question_text ORDER BY created_at ASC) as row_num
        FROM public.quizzes
    ) t
    WHERE t.row_num > 1
);

-- 2. Deduplicate Coding Practices
-- This deletes all but the first (oldest) entry for each unique title and description
DELETE FROM public.coding_practices
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY title, description ORDER BY created_at ASC) as row_num
        FROM public.coding_practices
    ) t
    WHERE t.row_num > 1
);

-- 3. Add Unique Constraints to prevent future duplicates
-- These constraints will allow the seed script to use ON CONFLICT (upsert logic)
ALTER TABLE public.quizzes 
ADD CONSTRAINT unique_quiz_question UNIQUE (category_id, question_text);

ALTER TABLE public.coding_practices 
ADD CONSTRAINT unique_coding_practice UNIQUE (title, description);

-- Optional: Verify the counts
SELECT 'Quizzes remain:' as info, COUNT(*) FROM public.quizzes
UNION ALL
SELECT 'Coding Practices remain:' as info, COUNT(*) FROM public.coding_practices;
