// Keep Jest runs isolated from the developer/production SQLite file.
// The database module reads DATABASE_PATH at import time, and Jest runs
// setupFiles before test modules are loaded, so every test file gets a fresh
// in-memory database connection.
process.env.DATABASE_PATH = ':memory:';
