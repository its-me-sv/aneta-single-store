CREATE TABLE organisations (
    id TIMEUUID,
    name TEXT,
    email TEXT,
    password_hash TEXT,
    creator_name TEXT,
    profile_picture TEXT,
    status INT,
    PRIMARY KEY (name)
);

CREATE CUSTOM INDEX org_id_index ON organisations (id) USING 'StorageAttachedIndex';

CREATE TABLE employee (
    id TIMEUUID,
    organisation TEXT,
    name TEXT,
    role TEXT,
    email TEXT,
    password_hash TEXT,
    projects SET<TEXT>,
    skills SET<TEXT>,
    leaves INT,
    status INT,
    request BOOLEAN,
    on_leave TIMEUUID,
    joined BOOLEAN,
    profile_picture TEXT,
    PRIMARY KEY ((ORGANISATION), email)
);

CREATE CUSTOM INDEX employee_email_index ON employee (email) USING 'StorageAttachedIndex';
CREATE CUSTOM INDEX employee_id_index ON employee (id) USING 'StorageAttachedIndex';
CREATE CUSTOM INDEX employee_joined_index ON employee (joined) USING 'StorageAttachedIndex';
CREATE CUSTOM INDEX employee_name_index ON employee (name) USING 'StorageAttachedIndex';
CREATE CUSTOM INDEX employee_role_index ON employee (role) USING 'StorageAttachedIndex';

CREATE TABLE sockets (
    id TIMEUUID,
    socket_id TEXT,
    PRIMARY KEY (id)
);

CREATE CUSTOM INDEX sockets_socket_id_index ON sockets (socket_id) USING 'StorageAttachedIndex';

CREATE TABLE tokens (
    id TIMEUUID,
    tkn TEXT,
    PRIMARY KEY (id)
);

CREATE TABLE projects (
    id TIMEUUID,
    organisation TEXT,
    name TEXT,
    description TEXT,
    status INT,
    resources SET<TEXT>,
    PRIMARY KEY ((organisation), name)
) WITH CLUSTERING ORDER BY (name ASC);

CREATE CUSTOM INDEX projects_id_index ON projects (id) USING 'StorageAttachedIndex';
CREATE CUSTOM INDEX projects_status_index ON projects (status) USING 'StorageAttachedIndex';

CREATE TABLE transactions (
    id TIMEUUID,
    organisation TEXT,
    recipient TEXT,
    amount DECIMAL,
    PRIMARY KEY (organisation, id)
) WITH CLUSTERING ORDER BY (id DESC);

CREATE CUSTOM INDEX transactions_recipient_index ON transactions (recipient) USING 'StorageAttachedIndex';

CREATE TABLE messages (
    id TIMEUUID,
    organisation TEXT,
    chat_id TEXT,
    sender TIMEUUID,
    reciever TIMEUUID,
    message TEXT,
    PRIMARY KEY ((organisation, chat_id), id)
) WITH CLUSTERING ORDER BY (id DESC);

ALTER TABLE messages DROP reciever;
