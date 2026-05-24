# Label-Validator

[![API](https://github.com/WilliamAalund/Label-Validator/actions/workflows/api.yml/badge.svg?branch=main)](https://github.com/WilliamAalund/Label-Validator/actions/workflows/api.yml) [![Website](https://github.com/WilliamAalund/Label-Validator/actions/workflows/web.yml/badge.svg?branch=main)](https://github.com/WilliamAalund/Label-Validator/actions/workflows/web.yml)

A small project that analyzes and determines compliance of TTB Labels with forms by leveraging AI.
# Development Setup
Follow these instructions to host the project locally:

- Clone this repository on your local machine.
- Ensure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is installed on your local machine.
- Create an .env file in the root of the repository and add a variable named `ANTHROPIC_API_KEY`. Set the variable's value to a valid Anthropic API key.

> [!IMPORTANT]
> Ensure that the ports used by this project's applications are ***NOT IN USE*** when using Docker Compose. (Ports specified in the compose.yaml file)

Run the command `docker compose up --build` in the root directory of the repository.

> [!NOTE]
> **Optional:** For local development outside Docker, install [pnpm](https://pnpm.io/installation) and run `pnpm install` from the repository root, then manually add 

# Approach

### Summary

The system is a simple web application with a monorepo structure utilizing anthropic AI to analyze images according to label specifications and mandates.

System UI is going to be designed to support both desktop and mobile workflows. Users can either upload images or take them directly with their phone. They will also have the ability to batch process images and go through them with a GUI interface.

### System Structure

The system is structured into three main packages:
- `packages/web` - The user facing website.
- `packages/api` - The backend service that the website queries.
- `packages/shared` - Shared Zod schemas and types used by both web and api.
I decided to use a monorepo setup since this service is pretty self contained, and I have experience with that kind of project structure via my capstone project. 

Since I was going to use a monorepo system, I decided to use a full TypeScript codebase to keep development smooth, and because this service is not the most critical application that needs a Rust/C++/C# backend: the backend API is going to be simple and is not intended for public consumption.

I decided to use Docker to make a portable development environment. This makes other contributors or developers have to work less to get the project up and running on their machine, which would accelerate development in an work environment.

### Hosting
I chose to host the services with Render due to its generous free tier, built in CD pipeline, and due to previous experience with the platform.

### Frontend
In order to improve development velocity, I decided to go with React: I have solid experience with the framework, and could spin up a working prototype quite quickly. While I could have taken this opportunity to pick up another web framework, I want to focus my learning energies on the backend technologies involved in the program.

### Backend
I started with researching the backend for this project. It seemed like there were a few main choices ahead of me for the language to use:
- Python
- Go
- TypeScript
- C#

I chose TypeScript due to its robust type system and ease of development. Since the frontend is also in TypeScript, Type schemas can also be created for API responses, which would be avaliable for consumption in the frontend.

