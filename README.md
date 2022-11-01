# Aneta Server with database migration from Cassandra to SingleStore
## Backend Setup
### Contents of `.env` file
```
# SingleSotre Creds
HOST = <YOUR SINGLESTORE CLOUD INSTANCE HOSTED URL>
USER = <YOUR SINGLESTORE DATABASE USER>
PASSWORD = <YOUR SINGLESTORE DATABASE USER'S PASSWORD>
DATABASE = <YOUR SINGLESTORE DATABASE NAME>

# Project Creds
SALT = <INTEGER IN THE RANGE 1 to 10 (inclusive)>
JWT_SECRET = <16 DIGIT ALPHANUMERIC STRING>
```
### Spinning up the server
```
1. Create the .env file like mentioned above
2. npm install
3. npm start / npm run dev (when in development mode)
```
## Frontend Setup
Frontend code - https://github.com/its-me-sv/aneta
```
1. Update defaultState in aneta/src/contexts/api.context.tsx
2. npm install
3. npm start
```
