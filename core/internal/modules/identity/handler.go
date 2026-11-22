package identity

import (
	"context"
	"time"

	"berryfresh/core/internal/config"
	"berryfresh/core/internal/database"
	"berryfresh/core/internal/middleware"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	cfg *config.Config
	db  *database.Database
}

func NewAuthHandler(cfg *config.Config, db *database.Database) *AuthHandler {
	return &AuthHandler{cfg: cfg, db: db}
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Success      bool     `json:"success"`
	AccessToken  string   `json:"access_token"`
	RefreshToken string   `json:"refresh_token"`
	ExpiresIn    int64    `json:"expires_in"`
	User         UserInfo `json:"user"`
}

type UserInfo struct {
	ID             string `json:"id"`
	Email          string `json:"email"`
	FullName       string `json:"full_name"`
	Role           string `json:"role"`
	OrganizationID string `json:"organization_id"`
	StoreID        string `json:"store_id"`
}

func (h *AuthHandler) Login(c fiber.Ctx) error {
	var req LoginRequest
	if err := c.Bind().Body(&req); err != nil || req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Email and password are required",
		})
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	var user UserInfo
	var passwordHash string
	var orgID, storeID *string

	if h.db != nil && h.db.Pool != nil {
		query := `
			SELECT u.id, u.email, u.full_name, u.password_hash, 
			       COALESCE(r.code, 'CUSTOMER') as role,
			       u.organization_id::text, u.assigned_store_id::text
			FROM identity.users u
			LEFT JOIN identity.user_roles ur ON ur.user_id = u.id
			LEFT JOIN identity.roles r ON r.id = ur.role_id
			WHERE u.email = $1 AND u.status = 'ACTIVE'
			LIMIT 1
		`
		err := h.db.Pool.QueryRow(ctx, query, req.Email).Scan(
			&user.ID, &user.Email, &user.FullName, &passwordHash,
			&user.Role, &orgID, &storeID,
		)

		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"message": "Invalid email or password",
			})
		}

		if orgID != nil {
			user.OrganizationID = *orgID
		}
		if storeID != nil {
			user.StoreID = *storeID
		}

		// Verify bcrypt password
		if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"message": "Invalid email or password",
			})
		}
	} else {
		// Mock fallback for isolated development without database
		switch req.Email {
		case "admin@berryfresh.com":
			if req.Password != "admin123" {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"success": false, "message": "Invalid credentials"})
			}
			user = UserInfo{ID: "e0000000-0000-0000-0000-000000000001", Email: req.Email, FullName: "Hendra Wijaya", Role: "ADMIN", OrganizationID: "a0000000-0000-0000-0000-000000000001"}
		case "cashier@berryfresh.com":
			if req.Password != "pos123" {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"success": false, "message": "Invalid credentials"})
			}
			user = UserInfo{ID: "e0000000-0000-0000-0000-000000000002", Email: req.Email, FullName: "Siti Rahma", Role: "CASHIER", OrganizationID: "a0000000-0000-0000-0000-000000000001", StoreID: "c0000000-0000-0000-0000-000000000001"}
		case "manager@berryfresh.com":
			if req.Password != "mgr123" {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"success": false, "message": "Invalid credentials"})
			}
			user = UserInfo{ID: "e0000000-0000-0000-0000-000000000003", Email: req.Email, FullName: "Dewi Lestari", Role: "MANAGER", OrganizationID: "a0000000-0000-0000-0000-000000000001", StoreID: "c0000000-0000-0000-0000-000000000001"}
		default:
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"message": "User not found or database not available",
			})
		}
	}

	// Issue JWT token (valid for 24 hours)
	expiresIn := int64(86400)
	claims := middleware.UserClaims{
		UserID:         user.ID,
		Email:          user.Email,
		Role:           user.Role,
		OrganizationID: user.OrganizationID,
		StoreID:        user.StoreID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "Berry-Fresh-Core",
			Subject:   user.ID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(h.cfg.JWTAccessSecret))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to generate authentication token",
		})
	}

	return c.JSON(LoginResponse{
		Success:      true,
		AccessToken:  tokenString,
		RefreshToken: tokenString,
		ExpiresIn:    expiresIn,
		User:         user,
	})
}

func (h *AuthHandler) Me(c fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(string)
	email, _ := c.Locals("email").(string)
	role, _ := c.Locals("role").(string)
	orgID, _ := c.Locals("organization_id").(string)
	storeID, _ := c.Locals("store_id").(string)

	fullName := "Authenticated User"
	if h.db != nil && h.db.Pool != nil && userID != "" {
		ctx, cancel := context.WithTimeout(c.Context(), 3*time.Second)
		defer cancel()
		_ = h.db.Pool.QueryRow(ctx, "SELECT full_name FROM identity.users WHERE id = $1", userID).Scan(&fullName)
	} else if email == "admin@berryfresh.com" {
		fullName = "Hendra Wijaya"
	} else if email == "cashier@berryfresh.com" {
		fullName = "Siti Rahma"
	}

	return c.JSON(fiber.Map{
		"success": true,
		"user": UserInfo{
			ID:             userID,
			Email:          email,
			FullName:       fullName,
			Role:           role,
			OrganizationID: orgID,
			StoreID:        storeID,
		},
	})
}
