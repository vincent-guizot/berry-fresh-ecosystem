package middleware

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestJWTIssuanceAndParsing(t *testing.T) {
	secret := "test_secret_key_12345"

	claims := UserClaims{
		UserID:         "user-123",
		Email:          "cashier@berryfresh.com",
		Role:           "CASHIER",
		OrganizationID: "org-123",
		StoreID:        "store-123",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("Failed to sign token: %v", err)
	}

	// Parse back
	parsedClaims := &UserClaims{}
	parsedToken, err := jwt.ParseWithClaims(tokenStr, parsedClaims, func(t *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil || !parsedToken.Valid {
		t.Fatalf("Failed to parse valid token: %v", err)
	}

	if parsedClaims.UserID != "user-123" || parsedClaims.Role != "CASHIER" {
		t.Errorf("Claims mismatch: UserID=%s, Role=%s", parsedClaims.UserID, parsedClaims.Role)
	}
}

func TestRBACRoleCheck(t *testing.T) {
	checkRole := func(userRole string, allowedRoles ...string) bool {
		if userRole == "OWNER" || userRole == "ADMIN" {
			return true
		}
		for _, r := range allowedRoles {
			if userRole == r {
				return true
			}
		}
		return false
	}

	// ADMIN has global access
	if !checkRole("ADMIN", "CASHIER") {
		t.Error("ADMIN should have access to CASHIER endpoints")
	}
	// OWNER has global access
	if !checkRole("OWNER", "WAREHOUSE") {
		t.Error("OWNER should have access to WAREHOUSE endpoints")
	}
	// CASHIER allowed on CASHIER
	if !checkRole("CASHIER", "CASHIER") {
		t.Error("CASHIER should have access to CASHIER endpoints")
	}
	// CUSTOMER forbidden on CASHIER
	if checkRole("CUSTOMER", "CASHIER") {
		t.Error("CUSTOMER should NOT have access to CASHIER endpoints")
	}
}
