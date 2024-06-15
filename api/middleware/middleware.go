package middleware

import (
	"context"
	"log"
	"money-monkey/api/auth"
	"money-monkey/api/types"
	"net/http"
	"time"
)

type wrappedWriter struct {
	http.ResponseWriter
	statusCode int
}

func (w *wrappedWriter) WriteHeader(statusCode int) {
	w.ResponseWriter.WriteHeader(statusCode)
	w.statusCode = statusCode
}

func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		next.ServeHTTP(&wrappedWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}, r)

		log.Println(r.Method, r.URL.Path, time.Since(start))
	})
}

func Auth(next http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, err := auth.ExtractClaims(r)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), types.UserIdKey, claims.UserId)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	})
}
