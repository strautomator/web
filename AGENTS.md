# Strautomator: Web

Web frontend and API of Strautomator. Depends on the strautomator-core to work.

## Stack

-   TypeScript + Firestore, running with Node.js.
-   Runs on GCP (Cloud Run + Cloud Firestore), exposed behind Cloudflare.

## Code Style

-   Keep the same style and patterns used in the existing source code, paying attention to comments, line breaks and code blocks.

## Dependencies

-   To clear and install everything from scratch: `make clean update`.
-   To just update dependencies: `make update`
