# Strautomator Web

This is Strautomator's web frontend, built with Nuxt + Vuetify. It depends on the [Strautomator Core](https://github.com/strautomator/core) to run.

**Please note that Strautomator is still in BETA! Its internals, API specs and general settings will likely change a lot before we hit a stable release.**

## Local setup

Download and install dependencies:

    $ git clone git@github.com:strautomator/web.git
    $ make update

Before you run on your local machine, you'll have to set your custom 3rd party credentials and secrets either on a `settings.secret.json` file, or via environment variables. A sample for both are available in the repo, on the [/samples](https://github.com/strautomator/web/blob/master/samples) folder.

You'll have to get the credentials for the Strava API, weather providers, Google Cloud Firestore etc... by yourself. *In the future we might add detailed docs for each here, if there's enough demand.*

### Setting the URL

Please note that the default URL in development is `http://strautomator.local`, which should be manually set on your HOSTS file. This is fine if you only want to work on the web frontend and some of the API calls, but please note that Strava won't be able to push activities to the service using that URL.

### Server ports

When starting up, the service will look for the `strautomator.cert` and `strautomator.key` files on the application root. If found, it will create a HTTPS server listening on port 8443 by default. Otherwise it will create a HTTP server on port 8080. Please note that the actual port can be overwriten either via the PORT environment variable, or via `settings.app.port`.

### Running it locally

Once you have set them up, then:

    $ make run

If anything's missing you'll see an alert on the console.

## Deplopyment

Strautomator is targeting GCP and can be easily deployed as a standalone VM instance, as a Cloud Run service, or to App Engine. Although you could also run it on other providers (AWS for instance), please keep in mind that the database (Firestore) runs on Google, unless you create your own version for other data stores.

### Deploying to GCE VM

Sample: [docker-compose.yml](https://github.com/strautomator/web/blob/master/samples/docker-compose.yml)

### Deploying to App Engine

Sample: [app.yaml](https://github.com/strautomator/web/blob/master/samples/app.yaml)

### Deploying to Cloud Run

Deploying to Cloud Run is as simple as creating a Cloud Build trigger to update your services whenever there's a new version pushed to GIT.
