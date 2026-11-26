FROM python:3.12-slim

RUN pip install --no-cache-dir mkdocs-materialx==10.2.3

WORKDIR /docs

ENTRYPOINT ["mkdocs"]
CMD ["serve", "--dev-addr=0.0.0.0:8000"]
