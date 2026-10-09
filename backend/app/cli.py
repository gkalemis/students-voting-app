import argparse
import secrets
import string
from sqlalchemy import select
from .database import SessionLocal
from .models import User
from .security import hash_password


def temporary_password(length: int = 20) -> str:
    alphabet = string.ascii_letters + string.digits + "-_.!"
    while True:
        value = "".join(secrets.choice(alphabet) for _ in range(length))
        if any(c.islower() for c in value) and any(c.isupper() for c in value) and any(c.isdigit() for c in value):
            return value


def reset_password(username: str) -> int:
    with SessionLocal.begin() as db:
        user = db.scalar(select(User).where(User.username == username))
        if not user:
            print(f"User not found: {username}")
            return 2
        password = temporary_password()
        user.password_hash = hash_password(password)
        user.must_change_password = True
        user.auth_version += 1
    print(f"Username: {username}")
    print(f"Temporary password: {password}")
    print("The user must change this password at the next sign-in.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Student Presentation Voting maintenance commands")
    commands = parser.add_subparsers(dest="command", required=True)
    reset = commands.add_parser("reset-password", help="Generate a temporary password and require its replacement")
    reset.add_argument("username")
    args = parser.parse_args()
    return reset_password(args.username) if args.command == "reset-password" else 2


if __name__ == "__main__":
    raise SystemExit(main())

