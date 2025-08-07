from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Backend is working!", "status": "ok"}

@app.get("/test")
def test_endpoint():
    return {"test": "success"}

if __name__ == "__main__":
    print("Starting simple test server on http://localhost:8001")
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="info")