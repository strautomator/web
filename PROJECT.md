# Strautomator: Web

Web frontend and API of Strautomator. Depends on the strautomator-core to work.

## Stack

- TypeScript + Firestore, running with Node.js.
- Runs on GCP (Cloud Run + Cloud Firestore), exposed behind Cloudflare.

## Install and deploy

- To clear and install everything from scratch: `make clean update`.
- To just update dependencies: `make update`.
- To deploy: `make deploy-git`. This will create a new GIT tag and trigger a new build on GCP.

## Notes and known issues

- Currently running on Nuxt 2, which is deprecated. No need to point it out.