# Per VPS/cloud: stesso codice, stessa cartella dati montata come volume.
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV XNB_HOST=0.0.0.0 XNB_PORT=8765 XNB_DATA_DIR=/data
VOLUME ["/data"]
EXPOSE 8765
CMD ["python", "-m", "xnb.api.app"]
