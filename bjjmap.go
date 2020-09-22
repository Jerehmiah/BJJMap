package main
import (    
    "github.com/go-martini/martini"
    "github.com/martini-contrib/render"
    "github.com/martini-contrib/sessions"
    "github.com/grandmore/mgosessions"
    "github.com/jerehmiah/BJJMap/database"
    "github.com/jerehmiah/BJJMap/auth"
)

func main() {
    auth.EstablishAuth()

    m := martini.Classic()

    m.Map(database.Database())
    store := mgosessions.NewMongoStore(database.Database().DB("sessions").C("sessions"), []byte("secret123"))
    store.Options.MaxAge = 31536000
    m.Use(sessions.Sessions("bjjmap_session", store))
    m.Use(render.Renderer())   

    

    m.Run()
}
