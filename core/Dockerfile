# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app
RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /bin/api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /bin/worker ./cmd/worker

# Runtime stage
FROM alpine:3.20

WORKDIR /app
RUN apk add --no-cache ca-certificates curl tzdata

COPY --from=builder /bin/api /app/api
COPY --from=builder /bin/worker /app/worker
COPY migrations /app/migrations

ENV APP_PORT=8080
ENV MIGRATIONS_DIR=/app/migrations

EXPOSE 8080

CMD ["/app/api"]
