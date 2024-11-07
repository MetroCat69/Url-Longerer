# Start dockerd in the background (skip if dockerd is already running)
sudo dockerd &

# Start LocalStack in the background
docker compose up --build &

samlocal local start-api -t cdk.out/CdkUrlShortenerStack.template.json 