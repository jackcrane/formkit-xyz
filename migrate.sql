BEGIN;

CREATE TABLE IF NOT EXISTS form_submissions (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_method TEXT NOT NULL DEFAULT 'POST',
  request_path TEXT NOT NULL,
  request_query JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_url TEXT,
  source_ip TEXT,
  forwarded_for TEXT,
  user_agent TEXT,
  origin_header TEXT,
  content_type TEXT,
  to_email TEXT,
  cc_email TEXT,
  bcc_email TEXT,
  reply_to_email TEXT,
  subject TEXT,
  next_url TEXT,
  submission_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  file_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  file_attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  file_count INTEGER NOT NULL DEFAULT 0,
  total_file_size_bytes INTEGER NOT NULL DEFAULT 0,
  delivery_status TEXT NOT NULL DEFAULT 'pending',
  delivery_error TEXT,
  provider_message_id TEXT,
  response_status INTEGER,
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at
  ON form_submissions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_form_submissions_delivery_status
  ON form_submissions (delivery_status);

CREATE INDEX IF NOT EXISTS idx_form_submissions_to_email
  ON form_submissions (to_email);

CREATE INDEX IF NOT EXISTS idx_form_submissions_source_url
  ON form_submissions (source_url);

CREATE INDEX IF NOT EXISTS idx_form_submissions_form_data
  ON form_submissions USING GIN (form_data);

CREATE INDEX IF NOT EXISTS idx_form_submissions_request_query
  ON form_submissions USING GIN (request_query);

COMMIT;
