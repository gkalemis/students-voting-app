import os
os.environ.update(DATABASE_URL="sqlite:///./test-voting.db",SECRET_KEY="test-secret-that-is-at-least-thirty-two-bytes",ADMIN_USERNAME="admin",ADMIN_PASSWORD="admin-password-123",PUBLIC_BASE_URL="http://testserver")
import pytest
from fastapi.testclient import TestClient
from app.database import Base,engine
from app.main import app
@pytest.fixture(autouse=True)
def clean():
 Base.metadata.drop_all(engine);Base.metadata.create_all(engine)
 yield
 Base.metadata.drop_all(engine)
@pytest.fixture
def client():
 with TestClient(app) as c:yield c
@pytest.fixture
def admin(client):
 return client.post('/api/auth/login',json={'username':'admin','password':'admin-password-123'}).json()['access_token']
def auth(t):return {'Authorization':f'Bearer {t}'}

