from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from .database import get_db
from .models import Role, User
from .security import decode_access_token

bearer = HTTPBearer(auto_error=False)


def authenticated_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if not credentials:
        raise HTTPException(401, "Απαιτείται σύνδεση")
    try:
        payload = decode_access_token(credentials.credentials)
        user = db.get(User, int(payload["sub"]))
    except Exception:
        raise HTTPException(401, "Μη έγκυρη ή ληγμένη σύνδεση")
    if not user or not user.active:
        raise HTTPException(401, "Ο λογαριασμός δεν είναι ενεργός")
    if int(payload.get("ver", -1)) != user.auth_version:
        raise HTTPException(401, "Η σύνδεση έχει ανακληθεί")
    return user


def current_user(user: User = Depends(authenticated_user)) -> User:
    if user.must_change_password:
        raise HTTPException(403, "Απαιτείται αλλαγή προσωρινού κωδικού", headers={"X-Password-Change-Required": "true"})
    return user


def admin_user(user: User = Depends(current_user)) -> User:
    if user.role != Role.ADMIN:
        raise HTTPException(403, "Απαιτείται ρόλος διαχειριστή")
    return user


def owns(owner_id: int, user: User):
    if user.role != Role.ADMIN and owner_id != user.id:
        raise HTTPException(404, "Δεν βρέθηκε")

