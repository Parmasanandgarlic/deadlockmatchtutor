# Security Policy

## Supported Versions

Only the latest version of Deadlock AfterMatch is currently supported for security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

**Do not open a GitHub Issue for security vulnerabilities.**

If you discover a security vulnerability within this project, please report it privately. We take security seriously and will work to address reported issues as quickly as possible.

To report a vulnerability, please email **security@aftermatch.xyz** with the following information:
- Type of issue (e.g., SQL injection, XSS, etc.)
- Steps to reproduce the issue
- Potential impact

We will acknowledge receipt of your report within 48 hours and provide a timeline for resolution.

## Environment Secret Protection

This project is open source. To protect your credentials, please follow these strict guidelines:

1.  **Never commit `.env` files**: Ensure `.env` is listed in `.gitignore`.
2.  **Use `.env.example`**: Only commit template files with placeholder values.
3.  **Rotate Keys**: If you suspect a key has been exposed, rotate it immediately in your external providers (Steam, Supabase, etc.).
4.  **SAST Scanning**: We use a built-in security scanner (`npm run test:sast`). Please run this before submitting any Pull Requests.

## Disclosure Policy

Once a fix is implemented, we will issue a security advisory and notify users. We ask that you do not disclose the vulnerability publicly until a fix is available and has been deployed to the live site.

---

*Thank you for helping keep Deadlock AfterMatch secure!*
