# Contributing

Contributions are welcome through GitHub issues and pull requests. Do not include real student data, production databases, `.env` files, credentials, exported results, or uploaded institutional assets in issues, fixtures, commits, or screenshots.

Security-sensitive changes need authorization-failure tests as well as success tests. Do not weaken first-login enforcement, ownership filters, vote uniqueness, anonymization, upload decoding, or export sanitization.

## Development workflow

1. Create a focused branch from the current default branch.
2. Install and run the backend and frontend as described in `README.md`.
3. Add tests for behavioral changes.
4. Run the commands in `TESTING.md`.
5. Update documentation and `CHANGELOG.md` when behavior or configuration changes.
6. Open a pull request describing the change, security implications, and actual test results.

Use synthetic Greek-language fixtures. Preserve backend ownership checks and stable presentation identities. Database changes require an additive Alembic migration; never rewrite a migration that may already be deployed.

By contributing, you agree that your contribution is licensed under the MIT License.

