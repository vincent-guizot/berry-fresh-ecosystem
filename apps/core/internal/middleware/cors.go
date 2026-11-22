package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
)

func NewCORS(allowedOrigins string) fiber.Handler {
	defaultOrigins := []string{
		"http://localhost:3000",
		"http://localhost:3001",
		"http://localhost:3002",
		"http://localhost:5173",
	}

	var origins []string
	if allowedOrigins != "" && allowedOrigins != "*" {
		for _, o := range strings.Split(allowedOrigins, ",") {
			trimmed := strings.TrimSpace(o)
			if trimmed != "" && trimmed != "*" {
				origins = append(origins, trimmed)
			}
		}
	}

	if len(origins) == 0 {
		origins = defaultOrigins
	} else {
		origins = append(origins, defaultOrigins...)
	}

	return cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		AllowCredentials: true,
	})
}
