package controllers
import (  
    "github.com/jerehmiah/BJJMap/auth"
    "github.com/jerehmiah/BJJMap/models"
    "github.com/martini-contrib/render"
    "gopkg.in/mgo.v2"
    "gopkg.in/mgo.v2/bson"
    "os"
)

type (
	PositionController struct {
        positions *mgo.Collection
        basePositions *mgo.Collection
	}
)

func NewPositionController(s *mgo.Session) *PositionController {
    positions := s.DB(os.Getenv("MAIN_DB_NAME")).C("positions")
    basePositions := s.DB(os.Getenv("MAIN_DB_NAME")).C("basePositions")
    positions.EnsureIndexKey("owner")
    basePositions.EnsureIndexKey("owner")
	return &PositionController{positions, basePositions}
}

func (pc *PositionController) GetBasePosition(userInfo *auth.UserInfo, r render.Render) {
    basePosition := models.Position{}
    err := pc.positions.Find(bson.M{"owner":userInfo.Email}).One(&basePosition)
    if err != nil {
        panic(err)
    }
    if len(basePosition.Owner) < 1 {
        r.JSON(404, "Not found")
        return
    }

    r.JSON(200, basePosition)
}

func (pc *PositionController) GetAllPositions(userInfo *auth.UserInfo, r render.Render) {
    positions := []models.Position{}
    err := pc.positions.Find(bson.M{"owner":userInfo.Email}).Limit(100).All(&positions)

    if err != nil {
        panic(err)
    }
    r.JSON(200, positions)
}

func (pc *PositionController) SetBasePosition(position models.Position, userInfo *auth.UserInfo, r render.Render) {
    pos := models.Position{}
    pc.basePositions.Find(bson.M{"owner":userInfo.Email})
    if !pos.Id.Valid() {
        pos.Id = bson.NewObjectId()
    }

    _, err := pc.basePositions.UpsertId(pos.Id, pos)
    if err != nil {
        panic(err)
    }
    r.JSON(200, pos)
}