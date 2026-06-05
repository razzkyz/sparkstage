CREATE TABLE product_retail_images (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_retail_id BIGINT NOT NULL REFERENCES public.product_retail(id) ON DELETE CASCADE,
  image_url VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_product_retail_images_product_id ON public.product_retail_images(product_retail_id);

CREATE OR REPLACE FUNCTION update_product_retail_images_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_product_retail_images_updated_at
BEFORE UPDATE ON product_retail_images
FOR EACH ROW
EXECUTE FUNCTION update_product_retail_images_updated_at_column();

-- Enable RLS
ALTER TABLE public.product_retail_images ENABLE ROW LEVEL SECURITY;

-- Policies for public viewing
CREATE POLICY "product_retail_images_select_public"
  ON public.product_retail_images FOR SELECT
  TO public
  USING (true);

-- Allow admins to manage images
CREATE POLICY "product_retail_images_admin_all"
  ON public.product_retail_images
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
