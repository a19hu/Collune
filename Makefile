build:
	docker build -t my-fastapi-app .

run:
	docker run -d -p 8080:8080 -e GOOGLE_APPLICATION_CREDENTIALS=/app/firebase-adminsdk.json --name=my-fastapi-app my-fastapi-app

stop:
	docker stop my-fastapi-app && docker rm my-fastapi-app

git:
	git add .
	git commit -m "tesitng done"
	git push origin devops


all:
	make stop
	make build
	make run