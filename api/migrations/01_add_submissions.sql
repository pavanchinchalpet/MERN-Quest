-- Create submissions table to track code attempts
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    practice_id UUID REFERENCES public.coding_practices(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language VARCHAR(50) DEFAULT 'javascript',
    status VARCHAR(50) NOT NULL, -- 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error'
    runtime FLOAT DEFAULT 0, -- in milliseconds
    memory FLOAT DEFAULT 0, -- in MB
    test_cases_passed INTEGER DEFAULT 0,
    total_test_cases INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookup by user or practice
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_practice_id ON public.submissions(practice_id);
