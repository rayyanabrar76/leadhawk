-- Drop the auth trigger entirely. Profile creation will be handled by the app
-- after signup succeeds. This avoids permission issues with auth.users triggers.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Also relax the email NOT NULL on profiles so a row can be created before
-- the email is fully confirmed.
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- Clean up any orphaned auth user from the failed signup attempt
DELETE FROM auth.users WHERE email = 'rayyanabrar76@gmail.com';
