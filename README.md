
# Questudy

## Setting up environment

### Secret Key
Create an .env file in the root directory. Add the secret key in this format (the one below is just an example any key in that format works): 

`SECRET_KEY=234b04d7096c179286656d3f9528ed2234628e3455a8ce1f669e0e591a0d18a3`

A new secret key can be generated with the following command: 

`openssl rand -hex 32`

You should also add the open ai api key. 

`OPENAI_API_KEY=<your_key_here>`

### Starting docker
To start the application use

`docker compose up --build`

from the project folder. This will start both the backend and the frontend in two differnt container. If one of them crashes it can be restarted with 

`docker-compose restart backend`

## Debuggin backedn from VS code

In `backend/app.py` remove `debug=True` from `app.run(host='0.0.0.0', port=5001)`

In `docker-compose.yml` uncomment `entrypoint: [ "python", "-m", "debugpy", "--listen", "0.0.0.0:5679", "-m", "app",  "--wait-for-client", "--multiprocess", "-m", "flask", "run", "-h", "0.0.0.0", "-p", "5001" ]`

Start the docker container as explained above

Launch debugger with mode: "Python: Remote Attach" [launch.json is already configured]

