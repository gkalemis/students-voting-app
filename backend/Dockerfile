FROM python:3.14.7-slim-trixie
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY alembic.ini .
COPY alembic alembic
COPY app app
RUN useradd -r -u 10001 app && mkdir -p /data/assets && chown -R app:app /data
USER app
CMD ["sh","-c","alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*'"]

