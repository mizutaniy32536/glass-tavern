CREATE TABLE generation_requests(id TEXT PRIMARY KEY,owner TEXT NOT NULL,chat_id TEXT NOT NULL,status TEXT NOT NULL,result TEXT);
CREATE INDEX generation_requests_owner_chat ON generation_requests(owner,chat_id);
