import os
os.environ.update(DATABASE_URL="sqlite:///./test-voting.db",SECRET_KEY="test-secret-that-is-at-least-thirty-two-bytes",ADMIN_USERNAME="admin",ADMIN_PASSWORD="admin-password-123",PUBLIC_BASE_URL="http://testserver",ALLOWED_HOSTS="testserver")
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
 token=client.post('/api/auth/login',json={'username':'admin','password':'admin-password-123'}).json()['access_token']
 result=client.put('/api/auth/password',headers={'Authorization':f'Bearer {token}'},json={'current_password':'admin-password-123','new_password':'admin-permanent-123'}).json()
 return result['access_token']
def auth(t):return {'Authorization':f'Bearer {t}'}

