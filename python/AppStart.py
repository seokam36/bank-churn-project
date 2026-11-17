from fastapi import FastAPI
import uvicorn
import Controller

app = FastAPI()
app.include_router(Controller.router)

if __name__ == '__main__':
    uvicorn.run('AppStart:app', host='127.0.0.1', port=8000, reload=True)