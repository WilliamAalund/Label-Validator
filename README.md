# Label-Validator

[![API](https://github.com/WilliamAalund/Label-Validator/actions/workflows/api.yml/badge.svg?branch=main)](https://github.com/WilliamAalund/Label-Validator/actions/workflows/api.yml) [![Website](https://github.com/WilliamAalund/Label-Validator/actions/workflows/web.yml/badge.svg?branch=main)](https://github.com/WilliamAalund/Label-Validator/actions/workflows/web.yml)

A small project that analyzes and determines compliance of TTB Labels with forms by leveraging AI.
# Development Setup
Follow these instructions to host the project locally:

- Clone this repository on your local machine.
- Ensure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is installed on your local machine.
- Copy `.env.example` to `.env` in the repository root and set:
  - `ANTHROPIC_API_KEY` — a valid Anthropic API key
  - `CORS_ORIGIN` — frontend URL for backend CORS permissions (use `http://localhost:5173` for local Docker Compose)
  - `VITE_API_URL` — API base URL for the web app (use `http://localhost:3010` for local Docker Compose)

> [!IMPORTANT]
> Ensure that the ports used by this project's applications are ***NOT IN USE*** when using Docker Compose. (Ports specified in the compose.yaml file)

Run the command `docker compose up --build -w` in the root directory of the repository. This will spin up local instances of both the backend API, and web application. the `-w` flag enables hot reloading of files, so making changes to source code will quickly be reflected in the local development environment.

> [!NOTE]
> **Optional:** For local development outside Docker, install [pnpm](https://pnpm.io/installation) and run `pnpm install` from the repository root, then manually run each service.

# Approach

### Summary

The system is a simple web application with a monorepo structure utilizing anthropic AI to analyze images according to label specifications and mandates. The web application can be accessed from any kind of browser, and the service supports processing png, jpeg or webp formats.

This repository leverages Docker Compose for local development, Infrastrucure as Code in the form of Render Blueprints, and a CI/CD pipleine to prevent regressions. All source code is written in TypeScript, and schemas for API responses and objects are provided in the shared package.

### System Structure

The system is structured into three main packages:
- `packages/web` - The user facing website.
- `packages/api` - The backend service that the website queries.
- `packages/shared` - Shared Zod schemas and types used by both web and api.

I decided to use a monorepo setup since this service is pretty self contained, and I have experience with that kind of project structure via my capstone project. 

Since I was going to use a monorepo system, I decided to use a full TypeScript codebase to keep development smooth, and because this service is not the most critical application that needs a Rust/C++/C# backend: the backend API is going to be simple and is not intended for public consumption.

I decided to use Docker and Docker Compose to enhance the development environment. This makes other contributors or developers have to work less to get the project up and running on their machine, which would accelerate development in a work environment.

### Frontend
In order to improve development velocity, I decided to go with React: I have solid experience with the framework, and could spin up a working prototype quite quickly. While I could have taken this opportunity to pick up another web framework, I want to focus my learning energies on the backend technologies involved in the program.

The frontend is quite minimal: I tried to make it as straightforward as possible and include popups and notifications to prompt users to input data, trying to prioritize Sarah's feedback there. You can drag or upload files directly into the website which makes it more accessible, and the analysis results will tell you how off the mark the application was.

This is elaborated on more in the backend section, but the frontend determines results by running string comparisons against the analyzed response from the backed. When an image comes back fully correct, the correct checkmark includes a little AI symbol and blurb to remind the user to be dilligent about verifying AI responses.

### Backend
I started with researching the backend for this project. It seemed like there were a few main choices ahead of me for the language to use:
- Python
- Go
- TypeScript
- C#

I chose TypeScript due to its robust type system and ease of development. Since the frontend is also in TypeScript, Type schemas can also be created for API responses, which would be avaliable for consumption in the frontend.

The backend is fairly straightforward: it has two main endpoints to hit for analyzing a single image, or a batch of up to five images. (The small image count is explained in the tradeoffs section.) Both of these endpoints utilize anthropic's vision API, which is a reliable service for analyzing and extracting text. An important detail is that the backend is *only* responsible for analyzing images and converting their content into a parseable JSON object. This allows me to reduce token count, and also let the string comparison logic, which is more straightforward and less error prone, to have the final verdict on what is right or not.

The backend also has rate limiting for the endpoints, and features an array of unit tests that are ran during Continuous Integration.

I would say out of all of the services I built, I am most proud of the backend.

### Hosting
I chose to host the services with Render due to its generous free tier, built in CD pipeline, and due to previous experience with the platform.

# Tradeoffs

Every system has its warts and this application is no exception. I think this system does a good job delivering a prototype. But it is not how I would go about setting up an enterprise grade implementation of the system for a few reasons:

### Backend
The backend is structure as it is to keep the costs of the prototype low, but I would structure it differently if it was in government:
- Document store w/worker instances to process images. There is no database/document store in this prototype; Everything exists inside of the backend which has limited compute resources. This is why I limited the batch job size. How I would actually design the backend structure is to change the API to submit a job request which is asynchronously processed by workers that will eventually return the result. This would be how you could get those numbers Sarah was talking about in the interview of 200, 300, 400 job batch requests.
- Linking the services with a govt account of some sort. This will protect against unauthorized usage. 
- I think that since this would be an internal tool utilized by government employees, horizontal scaling probably would not be necessary for the API itself, maybe some vertical scaling. 
- I don't regret using TypeScript and stand by that design decision, but I could be persuaded that another language like C# would also work well.

### Frontend
I tried my best to make a simple user experience, and I think I mostly succeeded. However there are probably some good areas for improvement:

- There could be a way to paste in form details more quickly instead of by field. This prototype presents the functionality of analysis correctly, but this is a way to make it move faster.
- Frontend could also store process results as cookies in the browser or in localdata so refreshing the page doesn't break things. 
- More tiny bells and whistles such as zooming in on images/loading spinners.

