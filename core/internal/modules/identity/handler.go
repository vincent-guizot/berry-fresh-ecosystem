package identity

import (
	"time"

	"berryfresh/core/internal/config"
	"berryfresh/core/internal/database"

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
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	// Default demo accounts with role resolution
	var user UserInfo
	switch req.Email {
	case "admin@berryfresh.com":
		user = UserInfo{ID: "usr-admin-01", Email: req.Email, FullName: "Hendra Wijaya", Role: "ADMIN", OrganizationID: "org-bf-hq", StoreID: ""}
	case "cashier@berryfresh.com":
		user = UserInfo{ID: "usr-pos-01", Email: req.Email, FullName: "Siti Rahma", Role: "CASHIER", OrganizationID: "org-bf-hq", StoreID: "store-jkt-central"}
	case "warehouse@berryfresh.com":
		user = UserInfo{ID: "usr-wh-01", Email: req.Email, FullName: "Bambang Tri", Role: "WAREHOUSE", OrganizationID: "org-bf-hq", StoreID: ""}
	case "manager@berryfresh.com":
		user = UserInfo{ID: "usr-mgr-01", Email: req.Email, FullName: "Dewi Anggraini", Role: "MANAGER", OrganizationID: "org-bf-hq", StoreID: "store-jkt-central"}
	default:
		// Accept demo login for any email with default role
		user = UserInfo{ID: "usr-demo-01", Email: req.Email, FullName: "Berry Fresh Operator", Role: "MANAGER", OrganizationID: "org-bf-hq", StoreID: "store-jkt-central"}
	}

	// Generate Access Token (15 mins)
	accessClaims := jwt.MapClaims{
		"user_id":         user.ID,
		"email":           user.Email,
		"role":            user.Role,
		"organization_id": user.OrganizationID,
		"store_id":        user.StoreID,
		"exp":             time.Now().Add(15 * time.Minute).Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	tokenString, err := accessToken.SignedString([]byte(h.cfg.JWTAccessSecret))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to issue access token"})
	}

	// Generate Refresh Token (7 days)
	refreshClaims := jwt.MapClaims{
		"user_id": user.ID,
		"exp":     time.Now().Add(7 * 24 * time.Hour).Unix(),
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshString, _ := refreshToken.SignedString([]byte(h.cfg.JWTRefreshSecret))

	return c.JSON(LoginResponse{
		Success:      true,
		AccessToken:  tokenString,
		RefreshToken: refreshString,
		ExpiresIn:    900,
		User:         user,
	})
}

func (h *AuthHandler) Me(c fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"success":         true,
		"user_id":         c.Locals("user_id"),
		"role":            c.Locals("role"),
		"organization_id": c.Locals("organization_id"),
		"store_id":        c.Locals("store_id"),
	})
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	return string(bytes), err
}
