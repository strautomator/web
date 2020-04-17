# Strautomator Web

This is Strautomator's web frontend, built with Nuxt + Vuetify. It depends on the [Strautomator Core](https://github.com/strautomator/core) to run.

## Quick start

Download and install dependencies:

    $ git clone git@github.com:strautomator/web.git
    $ make update

Before you run on your local machine, you'll have to set your custom 3rd party credentials and secrets either on a settings.private.json file, or via environment variables. A sample for both are available in the repo.

Once you have set them up, then:

    $ make run

If anything's missing you'll see an alert on the console.

### Setting the URL

Please note that the default URL in development is `http://strautomator.local`, which should be manually set on your HOSTS file. This is fine if you only want to work on the web frontend and some of the API calls, but please note that Strava won't be able to push activities to the service using that URL.

## Deplopyment

Strautomator is targeting GCP and can be easily deployed as a standalone VM instance or to App Engine. We haven't tested on Cloud Run, but it should also work just as fine. There are samples for app.yaml (App Engine) and a docker-compose.yml (standalone VM, using Docker Compose) on the repo.
