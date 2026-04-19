# DEVELOPER SETUP GUIDE

## Environment Setup

1. **Navigate to project root**:
   ```bash
   cd deadlockmatchtutor-1
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Copy example environment file**:
   ```bash
   cp server/.env.example server/.env
   ```

4. **Add your existing credentials to `server/.env`**:
   Ensure the following variables are set:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STEAM_API_KEY`
   - `SESSION_SECRET` (generate a unique string for your local session)

## Secret Management & Safety

> [!CAUTION]
> This is an open-source project. **Never** commit your `.env` file or any real API keys to version control.

- **Check status**: Before committing, run `git status` to ensure `.env` is not listed.
- **Example only**: If you add new environment variables, update `server/.env.example` with a **placeholder** value only.
- **Security Scans**: Run `npm run test:sast` periodically to check for accidental hardcoded secrets in the source code.

## Running the Application

1. **Execute**:
   ```bash
   npm run dev
   ```

2. **Access the application at**: [http://localhost:5173](http://localhost:5173)

## Troubleshooting

- **Server Port**: Ensure the backend server on port `3001` is running before the frontend attempts to connect.
- **Environment Variables**: Verify all environment variables are properly set in `server/.env`.
- **Supabase Credentials**: Check that Supabase credentials match your existing setup on the Supabase dashboard.

> [!NOTE]
> The `.env` file is ignored by Git and will not be pushed to the repository. Keep your credentials secure.
