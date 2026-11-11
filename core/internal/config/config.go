package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppName          string
	AppEnv           string
	AppPort          string
	DatabaseURL      string
	RabbitMQURL      string
	RabbitMQExchange string
	RedisURL         string
	JWTAccessSecret  string
	JWTRefreshSecret string
	CORSAllowOrigins string
}

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("[Config] No .env file found, using system environment variables")
	}

	return &Config{
		AppName:          getEnv("APP_NAME", "Berry Fresh Core"),
		AppEnv:           getEnv("APP_ENV", "development"),
		AppPort:          getEnv("APP_PORT", "8080"),
		DatabaseURL:      getEnv("DATABASE_URL", "postgres://berry:fresh_secret@localhost:5432/berryfresh_db?sslmode=disable"),
		RabbitMQURL:      getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
		RabbitMQExchange: getEnv("RABBITMQ_EXCHANGE", "berryfresh.events"),
		RedisURL:         getEnv("REDIS_URL", "redis://localhost:6379/0"),
		JWTAccessSecret:  getEnv("JWT_ACCESS_SECRET", "berryfresh_jwt_access_secret_2026"),
		JWTRefreshSecret: getEnv("JWT_REFRESH_SECRET", "berryfresh_jwt_refresh_secret_2026"),
		CORSAllowOrigins: getEnv("CORS_ALLOW_ORIGINS", "*"),
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
