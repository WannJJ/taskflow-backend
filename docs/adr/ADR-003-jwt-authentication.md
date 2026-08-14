# ADR-003: JWT Authentication with Access & Refresh Tokens

## Status

Accepted

## Context

TaskFlow requires user authentication with:

- Stateless sessions (API-first, SPA frontend)
- Secure token storage
- Token expiration and rotation
- Protection against XSS and CSRF

## Decision

We implemented a **JWT-based auth flow** with:

- **Access Token**: Short-lived (15 min), stored in Zustand memory
- **Refresh Token**: Long-lived (7 days), stored in HTTP-only cookie
- **bcrypt**: 10 salt rounds for password hashing

## Consequences

### Positive

- **Stateless**: No server-side session store needed
- **Scalable**: Easy to scale horizontally (no shared session storage)
- **Secure**: Short access token lifetime limits damage from token theft
- **Auto-refresh**: Silent token renewal via refresh token rotation
- **Industry standard**: JWT is universally understood by interviewers

### Negative

- **Token size**: JWT payloads are larger than session IDs
- **Cannot revoke immediately**: Access tokens live until expiry (mitigated by short TTL)
- **Clock skew**: Token validation depends on server time synchronization
- **Complexity**: Refresh token rotation logic adds implementation overhead

## Security Considerations

- Access Token stored in **memory** (Zustand store), NOT localStorage
- Refresh Token sent as **HTTP-only, Secure, SameSite=Strict cookie**
- Passwords hashed with **bcrypt** (adaptive hashing, resistant to rainbow tables)
- CORS configured to only allow frontend origin

## Alternatives Considered

- **Session-based (Redis)**: Simpler revocation, but requires Redis infrastructure
- **OAuth 2.0 / OpenID Connect**: Overkill for a self-contained app; better for SSO
- **Supabase Auth**: Would reduce backend scope, but we want to demonstrate auth implementation skills

## References

- [JWT.io](https://jwt.io/)
- [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [bcrypt on npm](https://www.npmjs.com/package/bcrypt)
