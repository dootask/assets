package jwt

import (
	"dootask-ai/go-service/pkg/utils"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	JWTSecret = []byte(utils.GetEnvWithDefault("JWT_SECRET", "dootask-ai-secret-key"))
	ExpireDay = utils.StrToInt(utils.GetEnvWithDefault("JWT_EXPIRES_IN_DAYS", "7"))
)

// Claims JWT Claims结构
type Claims struct {
	UserID   string `json:"userId"`
	jwt.RegisteredClaims
}

// GenerateAccessToken 生成访问令牌
func GenerateAccessToken(userID string) (string, error) {
	claims := Claims{
		UserID:   userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(ExpireDay) * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "dootask-ai",
			Subject:   userID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(JWTSecret)
}

// ParseToken 解析令牌
func ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return JWTSecret, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, errors.New("token is expired")
		}
		return nil, errors.New("token is invalid")
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("token is expired")
}

// ValidateToken 验证令牌有效性
func ValidateToken(tokenString string) (*Claims, error) {
	return ParseToken(tokenString)
}
