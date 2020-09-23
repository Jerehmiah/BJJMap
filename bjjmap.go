package main
import (    
    "github.com/go-martini/martini"
    "github.com/martini-contrib/render"
    "github.com/martini-contrib/sessions"
    "github.com/grandmore/mgosessions"
    "github.com/jerehmiah/BJJMap/database"
    "github.com/jerehmiah/BJJMap/auth"
    "github.com/jerehmiah/BJJMap/controllers"
)

func main() {
    auth.EstablishAuth()

    m := martini.Classic()

    m.Map(database.Database())
    store := mgosessions.NewMongoStore(database.Database().DB("sessions").C("sessions"), []byte("secret123"))
    store.Options.MaxAge = 31536000
    m.Use(sessions.Sessions("bjjmap_session", store))
    m.Use(render.Renderer())   

    auth.EstablishAuth()

    positionController := controllers.NewPositionController(database.Database())

    m.Group("/api/positions/:version", func(r martini.Router){
        r.Get("/", positionController.GetAllPositions)
        r.Get("/base", positionController.GetBasePosition)
        r.Post("/base", positionController.SetBasePosition)
    }, auth.TokenAuth())


    m.Run()
}
