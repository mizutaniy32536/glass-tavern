-- Read-only automatic backup credentials; revoke by deleting a row.
CREATE TABLE backup_devices(id TEXT PRIMARY KEY,owner TEXT NOT NULL,token_hash TEXT NOT NULL UNIQUE,created INTEGER NOT NULL);
