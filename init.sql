CREATE TABLE IF NOT EXISTS employee (
    organisation TEXT,
    email TEXT,
    id TIMESTAMP,
    joined BOOLEAN,
    leaves INT,
    name TEXT,
    on_leave TIMESTAMP,
    password_hash TEXT,
    profile_picture TEXT,
    projects JSON,
    request BOOLEAN,
    role TEXT,
    skills JSON,
    status INT
);

CREATE TABLE IF NOT EXISTS messages (
    organisation TEXT,
    chat_id TEXT,
    id TIMESTAMP,
    message TEXT,
    sender TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organisations (
    name TEXT,
    creator_name TEXT,
    email TEXT,
    id TIMESTAMP,
    password_hash TEXT,
    profile_picture TEXT,
    status INT
);

CREATE TABLE IF NOT EXISTS projects (
    organisation TEXT,
    name TEXT,
    description TEXT,
    id TIMESTAMP,
    resources JSON,
    status INT
);

CREATE TABLE IF NOT EXISTS sockets (
  id TIMESTAMP,
  socket_id TEXT
);

CREATE TABLE IF NOT EXISTS tokens (
  id TIMESTAMP,
  tkn TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
    organisation TEXT,
    id TIMESTAMP,
    amount DECIMAL(14, 7),
    recipient TEXT
);
