-- Pastikan role authenticated memiliki izin UPDATE pada tabel profiles
GRANT UPDATE ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO anon;
GRANT UPDATE ON public.profiles TO service_role;

-- Perbarui policy RLS agar lebih eksplisit menggunakan role authenticated
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
