###

```bash
cd/fronend
npm run dev

cd/backend
npm run dev

docker run -d -p 27017:27017 --name mongo mongo:7

docker start mongo

# Check it's running
docker ps

# Stop MongoDB
docker stop mongo

# Start it again next time
docker start mongo

# View logs if something seems wrong
docker logs mongo
```