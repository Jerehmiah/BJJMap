package models

import (
	"gopkg.in/mgo.v2/bson"
)

type Position struct {
	Id          bson.ObjectId  `json:"id" bson:"_id"`
	Owner       string         `form:"owner" json:"owner"`
	Public      bool           `bson:",omitempty" json:"public"`
	Transitions []Position     `bson:",omitempty" form:"transitions" json:"transitions"`
	Annotations []Annotation   `bson:",omitempty" form:"annotations" json:"annotations"`
	BotColor    string         `bson:",omitempty" form:"botcolor" json:"botcolor"`
	Origin      string         `bson:",omitempty" form:"origin" json:"origin"`
	GLTF        string         `bson:",omitempty" form:"gltf" json:"gltf"`
}