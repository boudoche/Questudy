up:
	docker compose up --build

debug:
	docker compose up frontend mongo --build
	# pycharm --line 1 --debug ./backend/app.py

deploy:
	git add .
	git commit -m "temp"
	git push