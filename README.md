# hrback

## Invitation email

Employee invitations are sent through SMTP. Configure these environment variables in Render for the backend service:

- `SMTP_HOST`
- `SMTP_PORT` (usually `465` for SSL or `587` for STARTTLS)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (the verified sender address)

The invitation link opens the frontend's `/accept-invite/:token` page. The employee sets a password there; invite links expire after 72 hours.
