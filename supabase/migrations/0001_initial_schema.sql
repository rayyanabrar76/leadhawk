-- LeadHawk initial schema

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  skill       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- google_tokens
CREATE TABLE IF NOT EXISTS google_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token  text NOT NULL,
  refresh_token text,
  expires_at    timestamptz NOT NULL,
  scopes        text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS google_tokens_user_id_idx ON google_tokens(user_id);

-- leads
CREATE TABLE IF NOT EXISTS leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source          text NOT NULL CHECK (source IN ('reddit', 'hackernews')),
  source_id       text NOT NULL,
  title           text NOT NULL,
  body            text,
  url             text NOT NULL,
  author          text NOT NULL,
  posted_at       timestamptz NOT NULL,
  freshness_score int NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'drafted', 'sent', 'skipped', 'no_email')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, source, source_id)
);

CREATE INDEX IF NOT EXISTS leads_user_id_posted_at_idx ON leads(user_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS leads_user_id_status_idx ON leads(user_id, status);

-- pitches
CREATE TABLE IF NOT EXISTS pitches (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          uuid NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  subject          text NOT NULL,
  body             text NOT NULL,
  sent_at          timestamptz,
  gmail_message_id text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pitches_lead_id_idx ON pitches(lead_id);

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_tokens_updated_at
  BEFORE UPDATE ON google_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitches       ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- google_tokens policies
CREATE POLICY "Users can view own tokens"
  ON google_tokens FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens"
  ON google_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens"
  ON google_tokens FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens"
  ON google_tokens FOR DELETE USING (auth.uid() = user_id);

-- leads policies
CREATE POLICY "Users can view own leads"
  ON leads FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leads"
  ON leads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads"
  ON leads FOR UPDATE USING (auth.uid() = user_id);

-- pitches policies (via leads join check)
CREATE POLICY "Users can view own pitches"
  ON pitches FOR SELECT USING (
    EXISTS (SELECT 1 FROM leads WHERE leads.id = pitches.lead_id AND leads.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own pitches"
  ON pitches FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM leads WHERE leads.id = pitches.lead_id AND leads.user_id = auth.uid())
  );

CREATE POLICY "Users can update own pitches"
  ON pitches FOR UPDATE USING (
    EXISTS (SELECT 1 FROM leads WHERE leads.id = pitches.lead_id AND leads.user_id = auth.uid())
  );

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
