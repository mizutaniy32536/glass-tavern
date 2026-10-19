ALTER TABLE generation_requests ADD COLUMN send_id TEXT;
ALTER TABLE generation_requests ADD COLUMN stage TEXT;
ALTER TABLE generation_requests ADD COLUMN usage TEXT;
ALTER TABLE generation_requests ADD COLUMN created INTEGER;
CREATE INDEX generation_usage_chat ON generation_requests(owner,chat_id,send_id);
