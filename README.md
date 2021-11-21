# Strautomator Web

This is Strautomator's web frontend, built with Nuxt + Vuetify. It depends on the [Strautomator Core](https://github.com/strautomator/core) to run. Please make sure you read the docs for the Core first before proceeding with the Web setup.

## Settings

Strautomator is using the [SetMeUp](https://github.com/igoramadas/setmeup) module to handle its settings, so for detailed info please check its [docs](https://setmeup.devv.com). The settings are split as follows:

-   **settings.json** - settings shared by all environments, targeting production by default
-   **settings.development.json** - development settings, mostly when running on your dev machine
-   **settings.production.json** - production-only settings, except credentials and secrets (optional)
-   **settings.secret.json** - private credentials and secrets, excluded from the GIT repo

Please note that the [Core](https://github.com/strautomator/core) also has its own collection of settings files as well.

## Local setup

Download and install dependencies:

    $ git clone git@github.com:strautomator/web.git
    $ make update

Before you run on your local machine, you'll have to set your custom 3rd party credentials and secrets either on a `settings.secret.json` file, or via environment variables. A sample for both are available on this repo's root folder.

### Setting the URL

Please note that the default URL in development is `http://strautomator.local`, which should be manually set on your HOSTS file. This is fine if you only want to work on the web frontend and some of the API calls, but please note that Strava (and other 3rd party webhooks) won't be able to push data to the service using that URL.

To properly test all APIs and webhooks from Strava and PayPal, you'll need to change the `app.url` setting on your `settings.secret.json` file or via the `$SMU_app_url` environment variable, to a publicly accessible URL.

### Server ports

When starting up, the service will look for the `strautomator.cert` and `strautomator.key` files on the application root. If found, it will create a HTTPS server listening on port 8443 by default. Otherwise it will create a HTTP server on port 8080. Please note that the actual port can be overwriten either via the PORT environment variable, or via `settings.app.port`.

### Running it locally

Once you have set them up, then:

    $ make run

If anything's missing you'll see an alert on the console.

## Deplopyment

Strautomator is targeting GCP and can be easily deployed as a standalone VM instance, as a Cloud Run service, or to App Engine. Although you could also run it on other providers (AWS for instance), please keep in mind that the database (Cloud Firestore) runs on Google.

Also note that even thou this project is open source, you might need to adapt some settings if you want to run it in production on your own cloud environment. This includes changing target URL (https://strautomator.com/), server IP and ports, HTMLs with references to strautomator.com, etc.

### Deploying to GCE VM

Sample: [docker-compose.yml](https://github.com/strautomator/web/blob/master/docker-compose.yml.sample)

### Deploying to App Engine

Sample: [app.yaml](https://github.com/strautomator/web/blob/master/app.yaml.sample)

### Deploying to Cloud Run

Deploying to Cloud Run is as simple as creating a [Cloud Build trigger](https://cloud.google.com/cloud-build/docs/automating-builds/create-manage-triggers) to update your services whenever there's a new version pushed to GIT.

### Locked in to Google Cloud Platform?

You might have noticed that the database, settings, deployment... everything has samples and mentions to GCP. And you are right. I (as in Igor, the developer) wanted to try out and get some experience with the GCP platform, and Strautomator is my pilot project. So far I've been very happy with it, and thus I have no urge to create a cross-cloud-platform version of this service.
