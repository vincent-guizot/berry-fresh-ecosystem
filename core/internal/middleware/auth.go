package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

type UserClaims struct {
	UserID         string `json:"user_id"`
	Email          string `json:"email"`
	Role           string `json:"role"`
	OrganizationID string `json:"organization_id"`
	StoreID        string `json:"store_id"`
	jwt.RegisteredClaims
}

func RequireAuth(jwtSecret string) fiber.Handler {
	return func(c fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"message": "Missing or malformed Authorization header",
			})
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		claims := &UserClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"message": "Invalid or expired authentication token",
			})
		}

		c.Locals("user_id", claims.UserID)
		c.Locals("role", claims.Role)
		c.Locals("organization_id", claims.OrganizationID)
		c.Locals("store_id", claims.StoreID)

		return c.Next()
	}
}

func RequireRoles(allowedRoles ...string) fiber.Handler {
	return func(c fiber.Ctx) error {
		userRole, ok := c.Locals("role").(string)
		if !ok || userRole == "" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"message": "Forbidden: No role assigned to token",
			})
		}

		// Owner and Admin have global access
		if userRole == "OWNER" || userRole == "ADMIN" {
			return c.Next()
		}

		for _, role := range allowedRoles {
			if userRole == role {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"message": "Forbidden: Insufficient permissions for this resource",
		})
	}
}
