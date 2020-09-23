package models

import (
	"gopkg.in/mgo.v2/bson"
)

type Annotation struct {
	Id          bson.ObjectId  `json:"id" bson:"_id"`
	Owner       string         `form:"owner" json:"owner"`
	Public      bool           `bson:",omitempty" json:"public"`
	Text        string         `form:"text" json:"text"`
	Vertex      Vertex         `form:"vertex" json"vertex"`
}