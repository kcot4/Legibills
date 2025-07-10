-- Add the search_vector column to the bills table
ALTER TABLE public.bills
ADD COLUMN search_vector tsvector;

-- Create a function to update the search_vector
CREATE OR REPLACE FUNCTION public.update_bills_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.summary, '') || ' ' ||
    COALESCE(NEW.simplified_text, '') || ' ' ||
    COALESCE(NEW.original_text, '')
  );
  RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Create a trigger to update search_vector on bills table changes
CREATE OR REPLACE TRIGGER bills_search_vector_update
BEFORE INSERT OR UPDATE OF title, summary, simplified_text, original_text ON public.bills
FOR EACH ROW EXECUTE FUNCTION public.update_bills_search_vector();

-- Create a function to update search_vector when sponsors change
CREATE OR REPLACE FUNCTION public.update_bills_search_vector_from_sponsors()
RETURNS TRIGGER AS $$
DECLARE
  bill_id_val uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    bill_id_val := OLD.bill_id;
  ELSE
    bill_id_val := NEW.bill_id;
  END IF;

  UPDATE public.bills
  SET search_vector = to_tsvector('english', 
    COALESCE(bills.title, '') || ' ' || 
    COALESCE(bills.summary, '') || ' ' ||
    COALESCE(bills.simplified_text, '') || ' ' ||
    COALESCE(bills.original_text, '') || ' ' ||
    (SELECT COALESCE(string_agg(name, ' '), '') FROM public.bill_sponsors WHERE bill_id = bill_id_val)
  )
  WHERE id = bill_id_val;

  RETURN NULL;
END;
$$
LANGUAGE plpgsql;

-- Create a trigger on bill_sponsors table changes
CREATE OR REPLACE TRIGGER bill_sponsors_search_vector_update
AFTER INSERT OR UPDATE OR DELETE ON public.bill_sponsors
FOR EACH ROW EXECUTE FUNCTION public.update_bills_search_vector_from_sponsors();

-- Create a function to update search_vector when committees change
CREATE OR REPLACE FUNCTION public.update_bills_search_vector_from_committees()
RETURNS TRIGGER AS $$
DECLARE
  bill_id_val uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    bill_id_val := OLD.bill_id;
  ELSE
    bill_id_val := NEW.bill_id;
  END IF;

  UPDATE public.bills
  SET search_vector = to_tsvector('english', 
    COALESCE(bills.title, '') || ' ' || 
    COALESCE(bills.summary, '') || ' ' ||
    COALESCE(bills.simplified_text, '') || ' ' ||
    COALESCE(bills.original_text, '') || ' ' ||
    (SELECT COALESCE(string_agg(committee_name, ' '), '') FROM public.bill_committees WHERE bill_id = bill_id_val)
  )
  WHERE id = bill_id_val;

  RETURN NULL;
END;
$$
LANGUAGE plpgsql;

-- Create a trigger on bill_committees table changes
CREATE OR REPLACE TRIGGER bill_committees_search_vector_update
AFTER INSERT OR UPDATE OR DELETE ON public.bill_committees
FOR EACH ROW EXECUTE FUNCTION public.update_bills_search_vector_from_committees();

-- Create a GIN index for fast full-text search
CREATE INDEX bills_search_vector_idx ON public.bills USING GIN (search_vector);

-- Populate search_vector for existing bills (run once)
UPDATE public.bills
SET search_vector = to_tsvector('english', 
  COALESCE(title, '') || ' ' || 
  COALESCE(summary, '') || ' ' ||
  COALESCE(simplified_text, '') || ' ' ||
  COALESCE(original_text, '') || ' ' ||
  (SELECT COALESCE(string_agg(name, ' '), '') FROM public.bill_sponsors WHERE bill_id = bills.id) || ' ' ||
  (SELECT COALESCE(string_agg(committee_name, ' '), '') FROM public.bill_committees WHERE bill_id = bills.id)
);
