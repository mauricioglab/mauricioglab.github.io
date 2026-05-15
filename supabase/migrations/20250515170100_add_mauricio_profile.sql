-- Crear perfil admin para Mauricio si el usuario de auth existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = '62547c61-853e-43aa-9cc3-68cd24424c44') THEN
    INSERT INTO profiles (id, role, nombre) 
    VALUES ('62547c61-853e-43aa-9cc3-68cd24424c44', 'admin', 'Mauricio')
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'Profile for Mauricio created or already exists';
  ELSE
    RAISE NOTICE 'Auth user 62547c61-853e-43aa-9cc3-68cd24424c44 not found, skipping profile insert';
  END IF;
END $$;
