CREATE TABLE public.legislators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bioguide_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  party TEXT,
  state TEXT,
  chamber TEXT, -- e.g., 'House', 'Senate'
  congress_start_date DATE,
  congress_end_date DATE,
  url TEXT,
  image_url TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.legislators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.legislators
FOR SELECT USING (TRUE);

CREATE POLICY "Enable insert for authenticated users only" ON public.legislators
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.legislators
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON public.legislators
FOR DELETE USING (auth.role() = 'authenticated');
