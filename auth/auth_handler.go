package auth
import (
	"context"
	"log"
	"fmt"
	"github.com/go-martini/martini"
    "github.com/martini-contrib/render"
	firebase "firebase.google.com/go/v4"
	"net/http"
)

var fbApp *firebase.App

type UserInfo struct {
	DisplayName string
	Email       string
	UID         string
}

func EstablishAuth() {
	//setup firebase app
	var err error
	fbApp, err = firebase.NewApp(context.Background(), nil)
    if err != nil {
        log.Fatalf("error initializing app: %v\n", err)
	}
}

func GetApp() *firebase.App {
	return fbApp
}

func TokenAuth() martini.Handler {  
    return func(c martini.Context, req *http.Request, r render.Render) {     
		client, err := fbApp.Auth(context.Background())
		if err != nil {
			log.Fatalf("error getting Auth client: %v\n", err)
			r.JSON(401, fmt.Sprint(err))
			return
		}
		token, err := client.VerifyIDToken(context.Background(), req.Header.Get("token"))
		if err != nil {
			log.Fatalf("error verifying ID token: %v\n", err)
			r.JSON(401, fmt.Sprint(err))
			return
		}
		user,err := client.GetUser(context.Background(), token.UID)
		if err != nil {
			log.Fatalf("Error getting user: %v\n", err)
			r.JSON(401, fmt.Sprint(err))
			return
		}
		userData := &UserInfo{user.DisplayName, user.Email, user.UID}
		c.Map(userData)
    }
}
