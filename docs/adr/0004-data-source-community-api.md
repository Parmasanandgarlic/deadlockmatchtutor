# ADR 0004: Data Source (Community API)

## Status
Accepted

## Context
Deadlock is in early testing, and official Valve match data APIs are limited or require local replay file parsing. We need a reliable way to fetch match history and stats for analysis.

## Decision
We chose to use the **Community-driven Deadlock API** (e.g., deadlock-api.com) as our primary data source.

## Rationale
- **Pre-parsed Data**: The community API already parses match data, including hero stats, itemization, and player performance, saving significant server-side processing.
- **Accessibility**: Easier to integrate with a REST-based community API than establishing a local replay-parser infrastructure in a serverless environment.
- **Developer Support**: Strong community support and frequently updated endpoints which often surface data before it's available through official channels.

## Consequences
- **Third-Party Dependency**: The app's availability is tied to the community API's uptime.
- **Data Latency**: There is a minor delay (2-5 mins) between match completion and API availability.
- **Reliability**: As a community project, the API may undergo breaking changes without extensive notice.
