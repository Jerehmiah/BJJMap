package auth
import (
	"context"
	"log"
	"fmt"
	"github.com/go-martini/martini"
    "github.com/martini-contrib/sessions"    
    "github.com/martini-contrib/render"
	firebase "firebase.google.com/go/v4"
	"net/http"
)

var fbApp *firebase.App

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
    return func(req *http.Request, session sessions.Session, r render.Render) {     
		client, err := app.Auth(context.Background)
		if err != nil {
			log.Fatalf("error getting Auth client: %v\n", err)
			r.JSON(401, fmt.Sprint(err))
		}
		token, err := client.VerifyIDToken(ctx, req.Header.Get("token"))
		if err != nil {
			log.Fatalf("error verifying ID token: %v\n", err)
			r.JSON(401, fmt.Sprint(err))
		}
		r.JSON(200, "Yay")
    }
}