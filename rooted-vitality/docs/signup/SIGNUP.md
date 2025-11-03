# Signup System - Rooted Vitality

## Current Implementation
- **File:** `/signup.html`
- **Handler:** `/scripts/signupHandler.js`
- **Database:** Supabase Auth + `public.profiles` table

## Flow
1. User fills form (name, email, phone, password, age, sex, gender)
2. `signupHandler.js` validates input
3. Creates auth user via `supabaseClient.auth.signUp()`
4. Database trigger auto-creates profile record
5. Handler updates profile with additional fields
6. User redirected to `/verify.html`

## Database Trigger
```sql
CREATE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at, updated_at)
  VALUES (new.id, new.email, 'client', COALESCE(new.created_at, now()), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Known Issues
- Email rate limit on free tier (3-4 signups/hour)
- Solution: Disable email confirmations or configure custom SMTP

## Status
✅ Working - Client signup functional with profile creation
