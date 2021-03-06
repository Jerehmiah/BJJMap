package controllers
import (  
    "github.com/go-martini/martini"
    "github.com/jerehmiah/BJJMap/auth"
    "github.com/jerehmiah/BJJMap/models"
    "github.com/martini-contrib/render"
    "gopkg.in/mgo.v2"
    "gopkg.in/mgo.v2/bson"
    "os"
    "fmt"
)

type (
	PositionController struct {
        positions *mgo.Collection
        basePositions *mgo.Collection
        corePositions *mgo.Collection
	}
)

func NewPositionController(s *mgo.Session) *PositionController {
    positions := s.DB(os.Getenv("MAIN_DB_NAME")).C("positions")
    basePositions := s.DB(os.Getenv("MAIN_DB_NAME")).C("basePositions")
    corePositions := s.DB(os.Getenv("MAIN_DB_NAME")).C("corePositions")
    positions.EnsureIndexKey("owner")
    basePositions.EnsureIndexKey("owner")
	return &PositionController{positions, basePositions, corePositions}
}

func (pc *PositionController) GetBasePosition(userInfo *auth.UserInfo, r render.Render) {
    basePosition := models.Baseposition{}
    err := pc.basePositions.Find(bson.M{"owner":userInfo.Email}).One(&basePosition)
    if err != nil || len(basePosition.Owner) < 1 {
        fmt.Printf("Looking for e-mail of %s\n", userInfo.Email)
        fmt.Printf("Error: %s\n", err)
        r.JSON(404, "Not found")
        return
    }
    position := models.Position{}
    err = pc.positions.FindId(basePosition.PositionId).One(&position)
    if err != nil || !position.Id.Valid()  {
        fmt.Printf("Found base position for  %s but failed to find matching position\n", userInfo.Email)
        fmt.Printf("Error: %s\n", err)
        r.JSON(404, "Not found")
        return
    }
    pc.populateTransitionsForPosition(&position)
    r.JSON(200, position)
}

func (pc *PositionController) SetBasePosition(position models.Position, userInfo *auth.UserInfo, r render.Render) {
    basePos := models.Baseposition{}
    positionIsValid := make(chan bool)
    position.Owner = userInfo.Email
    go pc.validatePosition(position,positionIsValid)

    pc.basePositions.Find(bson.M{"owner":userInfo.Email}).One(&basePos)
    if !basePos.Id.Valid() {
        basePos.Id = bson.NewObjectId()
        fmt.Printf("No base position existed, adding new.\nInjecting new user email of %s\n", userInfo.Email)
        basePos.Owner = userInfo.Email
    } 
    basePos.PositionId = position.Id
    if <-positionIsValid{
        _, err := pc.basePositions.UpsertId(basePos.Id, basePos)
        if err != nil {
            panic(err)
        }
    } else {
        fmt.Printf("No base position was changed as position passed was not valid")
        r.JSON(404, "Not found")
        return
    }
    r.JSON(200, basePos)
}

func (pc *PositionController) GetAllPositions(userInfo *auth.UserInfo, r render.Render) {
    positions := []models.Position{}
    err := pc.positions.Find(bson.M{"owner":userInfo.Email}).Limit(100).All(&positions)

    if err != nil {
        panic(err)
    }
    r.JSON(200, positions)
}

func (pc *PositionController) GetPosition(userInfo *auth.UserInfo, params martini.Params, r render.Render) {
    objId := bson.ObjectIdHex(params["id"])
    position := models.Position{}
    pc.positions.Find(bson.M{"_id":objId,"owner":userInfo.Email}).One(&position)
    if !position.Id.Valid() {
        fmt.Printf("Could not find position %s owned by %s\n", objId, userInfo.Email)
        r.JSON(404, "Not found")
        return
    }
    pc.populateTransitionsForPosition(&position)

    r.JSON(200, position)
}

func (pc *PositionController) SetTransitions(transitions []models.Position, userInfo *auth.UserInfo, params martini.Params, r render.Render){
    objId := bson.ObjectIdHex(params["id"])
    positionIsValid := make(chan bool, len(transitions))
    for _, transition := range transitions {
        transition.Owner = userInfo.Email
        go pc.validatePosition(transition, positionIsValid)
    }
    position := models.Position{}
    pc.positions.Find(bson.M{"_id":objId, "owner":userInfo.Email}).One(&position)
    if(!position.Id.Valid()){
        fmt.Printf("Could not find position %s owned by %s\n", objId, userInfo.Email)
        r.JSON(404, "Not found")
        return
    }

    validSoFar := true
    for range transitions {
        validSoFar = validSoFar && <-positionIsValid
    }
    
    if validSoFar{
        minimizeTransitions(transitions)
        position.Transitions = transitions
        _, err := pc.positions.UpsertId(objId, position)
        if err != nil {
            panic(err)
        }
    } else {
        fmt.Printf("No base position was changed as position passed was not valid")
        r.JSON(404, "Not found")
        return
    }
    r.JSON(200, position)    
}


func (pc *PositionController) SetAnnotations(annotations []models.Annotation, userInfo *auth.UserInfo, params martini.Params, r render.Render){
    objId := bson.ObjectIdHex(params["id"])
    position := models.Position{}
    pc.positions.Find(bson.M{"_id":objId, "owner":userInfo.Email}).One(&position)
    if(!position.Id.Valid()){
        fmt.Printf("Could not find position %s owned by %s\n", objId, userInfo.Email)
        r.JSON(404, "Not found")
        return
    }

    position.Annotations = annotations
    _, err := pc.positions.UpsertId(objId, position)
    if err != nil {
        panic(err)
    }

    r.JSON(200, position)
}

func(pc *PositionController) AddPosition(position models.Position, userInfo *auth.UserInfo, r render.Render) {
    position.Id = bson.NewObjectId()
    position.Owner = userInfo.Email
    err := pc.positions.Insert(position)
    if err != nil {
        panic(err)
    }
    r.JSON(201, position)
}

func(pc *PositionController) SavePosition(position models.Position, userInfo *auth.UserInfo, params martini.Params, r render.Render) {
    objId := bson.ObjectIdHex(params["id"])
    pos := models.Position{}
    pc.positions.Find(bson.M{"_id":objId, "owner":userInfo.Email}).One(&pos)
    if(!position.Id.Valid()){
        fmt.Printf("Could not find position %s owned by %s\n", objId, userInfo.Email)
        r.JSON(404, "Not found")
        return
    }

    pos.GLTF = position.GLTF
    pos.Transitions = position.Transitions
    pos.Description = position.Description

    _, err := pc.positions.UpsertId(objId, pos)
    if err != nil {
        panic(err)
    }

    r.JSON(200, pos)
}


func(pc *PositionController) AddCorePosition(position models.Coreposition, r render.Render) {
    position.Id = bson.NewObjectId()
    err := pc.corePositions.Insert(position)
    if err != nil {
        panic(err)
    }
    r.JSON(201, position)
}

func(pc *PositionController) GetCorePositions(r render.Render) {
    positions := []models.Coreposition{}
    err := pc.corePositions.Find(nil).All(&positions)

    if err != nil {
        panic(err)
    }
    r.JSON(200, positions)
}

func minimizeTransitions(transitions []models.Position){
    for _, transition := range transitions{
        transition.Owner = ""
        transition.Transitions = nil
        transition.Annotations = nil
        transition.GLTF = ""
        transition.Origin = ""
        transition.BotColor = ""
    }
}

func (pc *PositionController) populateTransitionsForPosition(position *models.Position) {
    positions := make([]models.Position, len(position.Transitions))
    transitionIds := make([]bson.ObjectId, len(position.Transitions))
    for i, transition := range position.Transitions{
        transitionIds[i] = transition.Id
    }
    err := pc.positions.Find(bson.M{"_id":bson.M{"$in":transitionIds}}).All(&positions)
    if err != nil {
        panic(err)
    }
    for _, transition := range positions{
        minimizeTransitions(transition.Transitions)
    }
    position.Transitions = positions
}

func (pc *PositionController) validatePosition(position models.Position, c chan bool){
    pos := models.Position{}
    err := pc.positions.Find(bson.M{"_id":position.Id, "owner":position.Owner}).One(&pos)
    if err != nil || !pos.Id.Valid()  {
        fmt.Printf("Passed position of  %s with owner %s was not found\n", position.Id, position.Owner)
        fmt.Printf("Error: %s\n", err)
        c <- false
        return
    }
    c <- true
}