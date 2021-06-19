package main
import (    
    "github.com/go-martini/martini"
    "github.com/martini-contrib/render"
    "github.com/martini-contrib/binding"
    "github.com/jerehmiah/BJJMap/database"
    "github.com/jerehmiah/BJJMap/models"
    "github.com/jerehmiah/BJJMap/auth"
    "github.com/jerehmiah/BJJMap/controllers"
)

func main() {

    m := martini.Classic()

    m.Map(database.Database())

    m.Use(render.Renderer())   

    auth.EstablishAuth()

    positionController := controllers.NewPositionController(database.Database())

    m.Group("/api/positions/:version", func(r martini.Router){
        r.Get("/", positionController.GetAllPositions)
        r.Post("/", binding.Bind(models.Position{}), positionController.AddPosition)
        r.Get("/base", positionController.GetBasePosition)
        r.Post("/base", binding.Bind(models.Position{}), positionController.SetBasePosition)
        r.Get("/core", positionController.GetCorePositions)
        r.Post("/core", binding.Bind(models.Coreposition{}),positionController.AddCorePosition)
        r.Post("/:id", binding.Bind(models.Position{}), positionController.SavePosition)
        r.Get("/:id", positionController.GetPosition)
        r.Post("/:id/annotations", binding.Bind([]models.Annotation{}),positionController.SetAnnotations)
        r.Post("/:id/transitions", binding.Bind([]models.Position{}), positionController.SetTransitions)
    }, auth.TokenAuth())


    m.Run()
}
