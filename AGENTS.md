# NO MIDDLE MAN — Agent Guidelines

## GitHub Automatic Synchronization

Whenever you make ANY change to the codebase (FastAPI backend, React frontend, configurations, database, tests, or bug fixes):

1. **Verify Local Status**:
   - Run backend tests (e.g., `verify.py` or `regression_test.py`).
   - Run `npm run build` in the `frontend` folder to verify compilation.
   - If tests or builds fail, fix them before proceeding.

2. **Commit Changes**:
   - Stage verified files using `git add .`.
   - Never commit `.env` local environment variables, SQLite database binaries (`no_middle_man.db`, `no_middle_man.db.bak`), package folders (`node_modules`), or compiled production assets (`dist`).
   - Create a clear, descriptive commit message.

3. **Push to Remote**:
   - Push the commit to the `main` branch at `https://github.com/Ragul-Gunasekaran/No-MiddleMan`.
   - Confirm that the push succeeded.

Do NOT wait for the user to explicitly ask for "Git push", "GitHub sync", or "commit". This workflow must run automatically as part of your verification step after every completed code change.
