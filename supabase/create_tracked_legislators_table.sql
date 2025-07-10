CREATE TABLE public.tracked_legislators (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  legislator_id UUID REFERENCES public.legislators(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, legislator_id)
);

ALTER TABLE public.tracked_legislators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read their tracked legislators" ON public.tracked_legislators
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert their tracked legislators" ON public.tracked_legislators
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete their tracked legislators" ON public.tracked_legislators
FOR DELETE USING (auth.uid() = user_id);
