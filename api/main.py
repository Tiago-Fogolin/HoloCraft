from fastapi import FastAPI

app = FastAPI()

@app.get("/api/dados")
def get_dados():
    return {"message": "Api Funcionando!"}
