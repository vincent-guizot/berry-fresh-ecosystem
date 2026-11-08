package middleware

import (
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
)

func NewCORS(allowedOrigins string) fiber.Handler {
	return cors.New(cors.Config{
		AllowOrigins:     []string{allowedOrigins, "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		AllowCredentials: true,
	})
}
